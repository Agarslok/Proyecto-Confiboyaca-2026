declare module "qrcode" {
  interface ToDataURLOptions {
    margin?: number;
    width?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    color?: { dark?: string; light?: string };
  }

  function toDataURL(text: string, options?: ToDataURLOptions): Promise<string>;

  export default { toDataURL };
}
