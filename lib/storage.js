const { supabase } = require("./supabase");

async function uploadFile({ userId, file }) {
    const storagePath =
        `${userId}/${Date.now()}-${file.originalname}`;

    const { data, error } = await supabase.storage
        .from("cloudvault")
        .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
        });

    if (error) {
        throw error;
    }

    const {
        data: { publicUrl },
    } = supabase.storage
        .from("cloudvault")
        .getPublicUrl(data.path);

    return {
        storagePath,
        publicUrl,
    };
}

// async function deleteFile(storagePath) {
//     const { error } = await supabase.storage
//         .from("cloudvault")
//         .remove([storagePath]);

//     if (error) {
//         throw error;
//     }
// }

async function deleteFile(storagePath) {
    const { error } = await supabase.storage
        .from("cloudvault")
        .remove([storagePath]);

    if (error) {
        throw error;
    }
}

async function deleteFiles(storagePaths) {
    const { error } = await supabase.storage
        .from("cloudvault")
        .remove(storagePaths);

    if (error) {
        throw error;
    }
}

module.exports = {
    uploadFile,
    deleteFile,
    deleteFiles,
};