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


async function createSignedUrl(storagePath) {
    const { data, error } = await supabase.storage
        .from("cloudvault")
        .createSignedUrl(storagePath, 60);

    if (error) {
        throw error;
    }

    return data.signedUrl;
}

module.exports = {
    uploadFile,
    deleteFile,
    deleteFiles,
    createSignedUrl,
};