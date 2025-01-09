const { ListObjectsCommand } = require("@aws-sdk/client-s3");

async function testS3() {
  try {
    const data = await s3.send(
      new ListObjectsCommand({
        Bucket: "uploadimageconnectbazaar",
      })
    );
    console.log("Liste des objets dans le bucket :", data);
  } catch (err) {
    console.error("Erreur S3 :", err);
  }
}

testS3();
