import QRCode from "qrcode";

export async function generateQrCodeBuffer(text: string): Promise<Buffer | null> {
  try {
    const buffer = await QRCode.toBuffer(text, {
      errorCorrectionLevel: "M",
      width: 400,
      margin: 2,
    });
    return buffer;
  } catch (error) {
    console.error("QR generation failed:", error);
    return null;
  }
}