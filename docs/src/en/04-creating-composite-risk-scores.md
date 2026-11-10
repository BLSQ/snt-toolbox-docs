<!-- Generated from the Claude Doc "SNT Toolbox documentation", tab "3. Creating composite risk scores". Do not edit here. -->

# 3. Creating composite risk scores

\*\*\* Under development \*\*\*

Outline. A composite layer combines several indicators into one risk score or risk class per district. It is built in SNT Explorer as a chain of steps, from the data layers to one output layer.

1. When to use a composite layer (e.g. incidence combined with prevalence, or a national risk class)
2. The building blocks: data layer, formula, classify (thresholds to classes), normalize (0–1 or percentile), combine (mean, sum, min, max, or by priority), filter (a subset of districts), output
3. Example: two indicators normalized and averaged into a score
4. Example: thresholds turning incidence and prevalence into four risk classes
5. Building a composite layer by describing it to the AI assistant, and checking the result
6. Handling years: yearly and timeless layers combined
