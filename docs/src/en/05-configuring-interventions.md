<!-- Generated from the Claude Doc "SNT Toolbox documentation", tab "4. Configuring interventions". Do not edit here. -->

# 4. Configuring interventions

Interventions and intervention categories are defined on the cost management page, together with the budget. Like the cost lines, they apply to all scenarios. How interventions are grouped in categories decides which interventions a district can receive together.

Include all interventions you may need in any scenario. If an intervention is implemented in very different ways, create separate interventions, as each will need its own cost lines. Note that cost lines are attached to interventions, so the interventions must exist before the budget can be set up.

## Default interventions

A new account starts with a default set of interventions, grouped as follows. Programmes can remove or rename them, and add their own categories and interventions.

| Category | Default interventions |
| --- | --- |
| Case management | Case management |
| ITN Campaign | Pyrethroid-only, PBO and Dual AI nets; IRS |
| ITN Routine | Pyrethroid-only, PBO and Dual AI nets |
| PMC & SMC | SMC, PMC |
| IPTp | IPTp |
| Vaccination | R21, RTS,S |
| Vector Control | LSM |

IRS sits in the ITN Campaign category so that a district receives either a net campaign or IRS, not both. The reasons for each grouping are given below.

## How categories work

- **Within a category, interventions are mutually exclusive.** A district receives at most one intervention per category. If two rules assign interventions from the same category to a district, only the intervention of the rule with the highest priority is kept. Within one rule, assign only one intervention per category.
- **Across categories, interventions are combined.** A district can receive one intervention from each category.

Putting two interventions in the same category is therefore the way to make sure they are never deployed together in a district. Putting them in separate categories allows them to be combined.

## Grouping interventions in line with WHO guidance

The grouping should follow the programme's policy and the WHO SNT manual (2025). Some common cases:

| Interventions | Category | Rationale (WHO SNT manual, 2025) |
| --- | --- | --- |
| Net types for one delivery channel (pyrethroid-only, PBO, dual active ingredient) | Same | A district receives one net type, chosen on insecticide-resistance data. |
| ITN mass campaign and routine ITN distribution (ANC, EPI, schools) | Separate, one per channel | The channels are complementary and run in the same districts. |
| ITNs and IRS | Same | Programmes should aim for high coverage of either ITNs or IRS; co-deployment adds little and IRS costs more per person protected. The exception is a deliberate insecticide-resistance management strategy. |
| SMC and PMC | Same | PMC and SMC should not be co-deployed. SMC suits short, intense transmission seasons; PMC suits areas with severe disease in young children throughout the year. |
| SMC with 3, 4 or 5 cycles | Same, or configured as one intervention with the conversion factor set per rule | A district receives one SMC schedule. |
| Malaria vaccine and SMC or PMC | Separate | Vaccination can be combined with PMC, or given before the season ahead of SMC in highly seasonal areas. |
| IPTp and SMC or PMC | Separate | Different target populations (pregnant women, young children) and delivery platforms. |
| Case management and iCCM | Separate | iCCM extends case management into the community, alongside facility-based case management. |
| LSM and ITNs | Separate | LSM can complement other vector control where breeding sites are few, fixed and easy to find. |

These groupings are a starting point. Where national policy differs, for example IRS and ITNs combined for resistance management, put the interventions in separate categories.

## Different implementations of the same intervention

When an intervention is delivered in clearly different ways, create one intervention per implementation, each with its own cost lines. Examples are SMC delivered door to door versus at fixed points, or case management with and without a user-fee subsidy. Put the variants in the same category when a district should receive only one of them.

Smaller differences between areas, such as a different conversion factor or unit cost, do not need a separate intervention. They can be set within the scenario, per rule (see Setting up the budget).
