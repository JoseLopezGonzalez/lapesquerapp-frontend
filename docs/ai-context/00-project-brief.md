# La PesquerApp Frontend — Project Brief

## Product

La PesquerApp is an ERP for companies in the fishing and frozen seafood sector.

It supports business operations such as:

- customer management;
- supplier management;
- product catalogs;
- sales orders;
- logistics;
- warehouses;
- pallets;
- boxes;
- lots;
- production;
- traceability;
- incidents;
- employee time tracking;
- sector-specific catalogs.

## Frontend responsibility

The frontend provides the operational interface for business users.

It must prioritize:

- reliability;
- clarity;
- consistent workflows;
- fast data entry;
- safe destructive actions;
- readable tables;
- robust forms;
- good integration with the Laravel API.

## Current architectural idea

The frontend should not contain complex business rules that belong to the backend.

It may handle:

- UI state;
- form state;
- validation for UX;
- API calls through services;
- user-friendly formatting;
- table configuration;
- navigation flows.

It must avoid:

- duplicating backend business logic;
- inventing fields;
- bypassing API services;
- hardcoding tenant-sensitive assumptions.
