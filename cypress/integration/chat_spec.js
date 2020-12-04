describe("My first tests", () => {
  it("Form Validation", () => {
    cy.visit("https://chat-app-obeka.herokuapp.com/");

    cy.get(".join-main");
    cy.get('input[name="username"]').type("Ömer").should("have.value", "Ömer");
    cy.get(".btn").click();
    cy.url().should("include", "/chat?username");
  });

  it("Sending a message", () => {
    cy.get('input[id="msg"]')
      .type("Hi All, this is for the test.")
      .should("have.value", "Hi All, this is for the test.");
    cy.get("#chat-form").click();
  });
});
