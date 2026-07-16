import { prisma } from "@/lib/prisma";
import AreaForm from "../../components/AreaForm";
import { updateArea } from "../../actions";


export default async function EditAreaPage({
    params,
}: {
    params: Promise<{ id:string }>
}) {


    const { id } = await params;



    const area = await prisma.area.findUnique({

        where:{
            id_area:Number(id)
        }

    });



    if(!area){

        return(
            <div className="p-8">
                Data area tidak ditemukan
            </div>
        );

    }




    return (

        <main className="min-h-screen bg-gray-50 p-8">


            <div className="mx-auto max-w-2xl bg-white rounded-2xl shadow p-8">


                <h1 className="text-3xl font-bold mb-5">
                    Edit Area
                </h1>



                <AreaForm

                    data={area}

                    action={
                        updateArea.bind(
                            null,
                            area.id_area
                        )
                    }

                />


            </div>


        </main>

    );

}