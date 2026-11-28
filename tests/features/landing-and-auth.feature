Feature: Public Landing Page and Team Access Management
  As a visitor or business owner
  I want to explore Takodu on the public landing page and manage team access
  So that I can understand the product and securely administer my organization

  @US01 @US02 @US03 @US04
  Scenario: Navigate from the public Landing Page to Login
    Given a visitor opens "https://takodu.com/"
    Then the visitor sees the Takodu value proposition and workspace preview
    When the visitor clicks the login call-to-action in the header
    Then the browser navigates to the login screen

  @US27 @US28 @US29 @US30
  Scenario: Access organization members, roles and invitations after login
    Given an authenticated owner is signed in to Valen
    When the owner navigates to "/organization/members", "/organization/roles" and "/organization/invitations"
    Then each access management view renders its corresponding controls
