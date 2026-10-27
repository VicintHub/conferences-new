import { describe, expect, it } from "vitest";
import { parseMembersCsv } from "./csv";

describe("parseMembersCsv", () => {
  it("reads a headed sheet in any column order", () => {
    const rows = parseMembersCsv("Email,Name,Phone,Mode,Category\nfunmi@x.com,Funmi Adeleke,0812 220 4410,online,Minister\n");
    expect(rows).toEqual([
      { full_name: "Funmi Adeleke", email: "funmi@x.com", phone: "+2348122204410", category: "minister", mode: "online" },
    ]);
  });

  it("works without a header and defaults sloppy values", () => {
    const rows = parseMembersCsv('"Okafor, Chidi",CHIDI@X.COM,,bishop,hybrid\r\n\r\nRuth,ruth@x.com');
    expect(rows).toEqual([
      { full_name: "Okafor, Chidi", email: "chidi@x.com", category: "delegate", mode: "onsite" },
      { full_name: "Ruth", email: "ruth@x.com", category: "delegate", mode: "onsite" },
    ]);
  });

  it("returns nothing for an empty file", () => {
    expect(parseMembersCsv("  \n")).toEqual([]);
  });
});
