const request = require("supertest");
const app = require("../../server");

describe("Inventory API", () => {

  it("✅ should create item (happy path)", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .send({
        name: "Milk",
        quantity: 10,
        min_threshold: 2
      });

    expect(res.statusCode).toBe(201);
  });

  it("❌ should fail on invalid input", async () => {
    const res = await request(app)
      .post("/api/inventory")
      .send({
        name: "",
        quantity: -5
      });

    expect(res.statusCode).toBe(400);
  });

});