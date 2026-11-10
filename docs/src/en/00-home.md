<!-- Generated from the Claude Doc "SNT Toolbox documentation", tab "Home". Do not edit here. -->

# Home

## What the SNT Toolbox is

The SNT Toolbox supports national malaria programmes to run and update their subnational tailoring (SNT) analyses themselves: data assembly and cleaning, stratification, intervention targeting and budgeting. Analyses can be rerun when new routine data come in, not only when a funding request is prepared.

The toolbox has two components:

- **OpenHEXA**, a data platform. A set of data pipelines extracts routine data from DHIS2 or the national malaria data repository (NMDR), adds global data (population, rainfall, MAP, DHS/MIS surveys), cleans the data and computes standard SNT indicators. The code of the SNT pipelines is open and available on GitHub: [BLSQ/snt\_development](https://github.com/BLSQ/snt_development/tree/main).
- **SNT Explorer**, a web application for decision-making. Users map indicators, define strata, assign interventions to districts, estimate budgets and compare scenarios, including modelled impact. The code of SNT Explorer is open and available on GitHub: [BLSQ/snt-malaria](https://github.com/BLSQ/snt-malaria).

<!-- Not synced: embedded content "Main workflow · NMDR, OpenHEXA, SNT Explorer" (see the Claude Doc). -->

The toolbox is intended for programme officers without coding experience and for analysts who prefer to work in their own scripts. The workflow has been tested during GC8 with the national programmes of Niger, Cameroon, DRC and Burundi, and was built together with PATH, CHAI, AHADI, IDM and Swiss TPH.

## Three ways to use the toolbox

OpenHEXA and SNT Explorer work together, but each can also be used on its own.

| Option | Component | What it does | Suits |
| --- | --- | --- | --- |
| Data analysis only | OpenHEXA | The analytical backbone on top of the NMDR or HMIS. Pipelines keep the SNT analyses up to date as new routine data come in. Cleaned data and results can be reintroduced into the NMDR if needed; this is not automatic and is set up with each country. Analysts can add their own analyses and dashboards, including with AI prompts. | Programmes that want their SNT analyses updated continuously from routine data, and plan with other tools. |
| Full workflow | OpenHEXA and SNT Explorer | Pipelines prepare the data and indicators; SNT Explorer uses the results for stratification, budgeting and scenario comparison. | Programmes that want analyses and plans updated as new routine data come in. |
| Decision-making platform only | SNT Explorer | Data and analyses are prepared elsewhere (own scripts, partners) and uploaded as layers, then used for stratification, budgeting and scenario comparison. | Teams that already run their own analyses, or that start by replicating an existing NSP or GC8. |

A programme can start with one option and move to the full workflow later.

## Where to go next

- [What the toolbox does](./what-the-toolbox-does.html): which parts of the SNT process the toolbox covers, what can be adjusted, and what it does not do yet. Start here.
- The SNT steps, one page each:
  - [1. Data orchestration and analysis](./data-orchestration-and-analysis.html)
  - [2. Importing and reviewing data](./importing-and-reviewing-data.html)
  - [3. Creating composite risk scores](./creating-composite-risk-scores.html)
  - [4. Configuring interventions](./configuring-interventions.html)
  - [5. Setting up the budget](./setting-up-the-budget.html)
  - [6. Building a scenario](./building-a-scenario.html)
- [FAQ](./faq.html): hosting, cost, data ownership and other common questions.

Try SNT Explorer on the [demo site](https://demo.snt-toolbox.org/) (username and password: demo), or see [snt-toolbox.org](https://www.snt-toolbox.org).

## Contributors

The SNT Toolbox is the product of close collaboration between SNT analysts, modelling partners, costing experts and software development partners, working alongside national malaria programmes to turn subnational tailoring analyses into actionable, costed plans. It draws on the experience of costing and impact dashboards previously developed by partners, including Swiss TPH, IDM, PATH and CHAI.
