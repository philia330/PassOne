type Props = {
    action: (formData: FormData) => void;

    data?: {
        id_area: number;
        kode_area: string;
        nama_area: string;
        keterangan: string | null;
    };
};


export default function AreaForm({
    action,
    data
}: Props) {


    return (

        <form action={action} className="space-y-5">


            <div>

                <label className="block mb-2 font-medium">
                    Kode Area
                </label>


                <input
                    type="text"
                    name="kode_area"
                    defaultValue={data?.kode_area ?? ""}
                    className="w-full border rounded-lg p-3"
                    placeholder="Masukkan kode area"
                />

            </div>



            <div>

                <label className="block mb-2 font-medium">
                    Nama Area
                </label>


                <input
                    type="text"
                    name="nama_area"
                    defaultValue={data?.nama_area ?? ""}
                    className="w-full border rounded-lg p-3"
                    placeholder="Masukkan nama area"
                />

            </div>



            <div>

                <label className="block mb-2 font-medium">
                    Keterangan
                </label>


                <textarea
                    name="keterangan"
                    defaultValue={data?.keterangan ?? ""}
                    className="w-full border rounded-lg p-3"
                    placeholder="Keterangan area"
                />

            </div>



            <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-3 rounded-lg"
            >
                Simpan
            </button>


        </form>

    );
}