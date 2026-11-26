Feature: CRM Customers and WhatsApp Conversations UI
  As an authenticated team member
  I want to search customers and respond to WhatsApp conversations from Valen
  So that client communication stays centralized and traceable

  @US20 @US21 @US22
  Scenario: List and search customers in CRM
    Given an authenticated member opens "/customers"
    When the member filters customers by name or phone
    Then matching customer records are displayed

  @US23 @US24 @US25 @US26
  Scenario: Inspect a conversation thread and toggle AI assistance
    Given an authenticated member opens "/conversations"
    When the member selects an active conversation
    Then the message history scrolls inside the workspace
    And controls to reply, update status and pause or resume AI assistance are available
