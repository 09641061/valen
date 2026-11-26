Feature: Organization Settings, Service Catalog and Calendar UI
  As an authenticated business owner or staff member
  I want to configure the organization, maintain services and view the calendar
  So that daily operations are coordinated from a single web workspace

  @US05 @US06
  Scenario: View and update organization profile
    Given an authenticated owner opens "/organization"
    Then the business profile, WhatsApp Business and Takodu Assistant sections are displayed

  @US07 @US08 @US09
  Scenario: Browse and manage catalog categories and services
    Given an authenticated owner opens "/catalog"
    Then existing service categories and services are listed for management

  @US10 @US11 @US12 @US13 @US14
  Scenario: View and manage appointments in the Calendar workspace
    Given an authenticated member opens "/calendar"
    Then the schedule view displays appointments and allows creating or updating bookings
