import html2canvas from "html2canvas";
import { axiosInstance } from "./axios";

export async function generateAndUploadPreview(templateId: string, htmlBody: string) {
  const iframe = document.createElement("iframe");
  iframe.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:600px;height:800px;border:none;visibility:hidden;";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument!;
  doc.open();
  doc.write(htmlBody);
  doc.close();

  await new Promise((r) => setTimeout(r, 400)); // let fonts/images settle

  const canvas = await html2canvas(doc.body, {
    width: 600,
    height: 800,
    scale: 2,
    useCORS: true,
    logging: false,
  });

  document.body.removeChild(iframe);

  const blob = await new Promise<Blob>((res, rej) =>
    canvas.toBlob(
      (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
      "image/jpeg",
      0.8
    )
  );

  const formData = new FormData();
  formData.append("file", blob, "preview.jpg");

  await axiosInstance.post(`/mailer/templates/${templateId}/preview`, formData);
}