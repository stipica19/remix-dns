export enum RTypeStr {
  A = "A",
  AAAA = "AAAA",
  CNAME = "CNAME",
  MX = "MX",
  NS = "NS",
  SOA = "SOA",
  TXT = "TXT",
  // Dodaj ostale ako treba
}

export function rtype_str_to_enum(type: string): number {
  const map: Record<string, number> = {
    A: 1,
    NS: 2,
    CNAME: 5,
    SOA: 6,
    MX: 15,
    TXT: 16,
    AAAA: 28,
    // Dodaj po potrebi
  };
  return map[type.toUpperCase()] ?? 0;
}

export function concate_rdata(obj: Record<string, any>): string {
  let result = "";
  console.log("obje.prp",obj.type);

  switch (obj.type) {
    case RTypeStr.MX:
        console.log("cccccccccc");
      result = `${obj.priority}  ${obj.value}`;
      break;

    case RTypeStr.SOA:
      result = `${obj.mname} ${obj.rname} ${obj.serial} ${obj.refresh} ${obj.retry} ${obj.expire} ${obj.minimum}`;
      break;

    case RTypeStr.A:
    case RTypeStr.AAAA:
      result = obj.value;
      break;

    case RTypeStr.NS:
    case RTypeStr.CNAME:
      result = `${obj.value}.`;
      break;

    case RTypeStr.TXT:
      result = obj.value;
      break;

    default:
      result = obj.value;
      break;
  }

  return result;
}
