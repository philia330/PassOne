import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@/lib/auth/roles";
import * as XLSX from "xlsx";


export async function GET(){

    // Proteksi: Hanya ADMIN yang boleh akses
    const session = await auth();
    if (!session || session.user?.role !== Role.ADMIN) {
        return NextResponse.json(
            { success: false, message: "Akses ditolak. Hanya Admin yang dapat mengakses." },
            { status: 403 }
        );
    }

    return NextResponse.json({
        success:true,
        message:"API Import BAA aktif"
    });

}



function excelDateToJSDate(value:any){

    if(!value)
        return null;


    if(value instanceof Date)
        return value;


    if(typeof value === "number"){

        return new Date(
            (value - 25569) * 86400 * 1000
        );

    }


    return new Date(value);

}




function decimalValue(value:any){

    if(
        value === null ||
        value === undefined ||
        value === ""
    )
        return null;


    const n = Number(value);


    if(isNaN(n))
        return null;


    return new Prisma.Decimal(n);

}




function numberValue(value:any){

    if(
        value === null ||
        value === undefined ||
        value === ""
    )
        return null;


    const n = Number(value);


    if(isNaN(n))
        return null;


    return n;

}





export async function POST(request:Request){

    // Proteksi: Hanya ADMIN yang boleh import
    const session = await auth();
    if (!session || session.user?.role !== Role.ADMIN) {
        return NextResponse.json(
            { success: false, message: "Akses ditolak. Hanya Admin yang dapat mengimpor data." },
            { status: 403 }
        );
    }

try{


const formData =
await request.formData();


const file =
formData.get("file");



if(!file || !(file instanceof File)){

return NextResponse.json(
{
success:false,
message:"File Excel tidak ditemukan"
},
{
status:400
}
);

}



const buffer =
Buffer.from(
await file.arrayBuffer()
);



const workbook =
XLSX.read(
buffer,
{
type:"buffer"
}
);



const sheet =
workbook.Sheets[
workbook.SheetNames[0]
];



const rows:any[] =
XLSX.utils.sheet_to_json(
sheet,
{
defval:null
}
);



if(rows.length===0){

return NextResponse.json(
{
success:false,
message:"Excel kosong"
},
{
status:400
}
);

}



console.log(
"HEADER:",
Object.keys(rows[0])
);



/*
 =========================
 VALIDASI DATA EXCEL
 =========================
*/


const data = rows.map((row,index)=>{


if(!row.kode_baa)
throw new Error(
`kode_baa kosong baris ${index+2}`
);



if(!row.id_fab)
throw new Error(
`id_fab kosong baris ${index+2}`
);



if(!row.id_odp)
throw new Error(
`id_odp kosong baris ${index+2}`
);



if(!row.id_olt)
throw new Error(
`id_olt kosong baris ${index+2}`
);




return {

kode_baa:
String(row.kode_baa).trim(),



tanggal_instalasi:
excelDateToJSDate(
row.tanggal_instalasi
) ?? new Date(),



status: "SELESAI" as const,



catatan:
row.catatan || null,


foto_instalasi:
row.foto_instalasi || null,



id_user:
Number(row.id_user),



id_fab:
Number(row.id_fab),



id_olt:
Number(row.id_olt),



id_odp:
Number(row.id_odp),



ping_ms:
decimalValue(row.ping_ms),



port_odp:
numberValue(row.port_odp),



port_olt:
numberValue(row.port_olt),



rx_power_dbm:
decimalValue(row.rx_power_dbm),



speed_download:
row.speed_download
?
String(row.speed_download)
:
null,



speed_upload:
row.speed_upload
?
String(row.speed_upload)
:
null,



tx_power_dbm:
decimalValue(row.tx_power_dbm)

};


});





console.log(
"DATA IMPORT:",
data[0]
);





/*
 =========================
 CEK FOREIGN KEY
 =========================
*/


for(const item of data){


const fab =
await prisma.fab.findUnique({

where:{
id_fab:item.id_fab
}

});



if(!fab){

throw new Error(
`FAB dengan id_fab ${item.id_fab} tidak ditemukan`
);

}




if(item.id_olt){

const olt =
await prisma.olt.findUnique({

where:{
id_olt:item.id_olt
}

});


if(!olt){

throw new Error(
`OLT dengan id_olt ${item.id_olt} tidak ditemukan`
);

}

}




const odp =
await prisma.odp.findUnique({

where:{
id_odp:item.id_odp
}

});


if(!odp){

throw new Error(
`ODP dengan id_odp ${item.id_odp} tidak ditemukan`
);

}


}





/*
 =========================
 CEK DUPLIKAT
 =========================
*/


const kode =
data.map(
x=>x.kode_baa
);



const duplicate =
kode.filter(
(k,i)=>kode.indexOf(k)!==i
);



if(duplicate.length){

return NextResponse.json(
{
success:false,
message:"Kode BAA duplikat",
duplicate
},
{
status:400
}
);

}





/*
 =========================
 INSERT
 =========================
*/


const result =
await prisma.baa.createMany({

data

});




return NextResponse.json({

success:true,

message:"Import BAA berhasil",

totalImport:
result.count

});





}
catch(error:any){


console.error(
"IMPORT ERROR:",
error
);



return NextResponse.json(
{
success:false,
message:error.message
},
{
status:500
}
);


}


}