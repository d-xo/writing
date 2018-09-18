# A Trust Weighted Voting Scheme For a Personal Issuance Rate

This is a proposal for a voting scheme to determine the issuance rate in circles. This is not a practical proposal as is, but I found it interesting to think through, so I'm sharing it here.

In this scheme each user votes by proposing an issuance rate. A personal issuance rate for each user can then be derived by making use of the trust graph.

This scheme has the following properties:

1. The rate can differ throughout the trust graph
2. The rate changes gradually throughout the trust graph
3. Nodes with more trust have more influence over the rate
4. Nodes can only influence the rate for nodes close to them in the trust graph

## Algorithm

The amount of trust at each node can be measured by taking the sum of all the balances on all of it's connections.

If we wish to calculate a personal issuance rate for a node in the graph we must think from the point of view of that node.

We can assign a weight to every node on the graph based on their distance from us and their trust.

- Nodes that have more trust have a higher weight.
- Nodes that are further from us have a lower weight.

The issuance rate can then be calculated as the weighted average of the votes across the graph.

If we repeat this calculation for every node we get a continuous gradually varying issuance rate across the trust graph.

## Open Questions

- Should an individuals vote be counted when calculating their rate?
- How far into the trust graph should an individual be able to influence?
- How does this affect the incentives of participants, would this just lead to hyperinflation?

## Feasibility

I have not calculated the complexity of this algorithm, but I'm sure it's brutal. 🤷‍♀️

Maybe there is some way to chunk the computation so that it can be run on bounded subsections of the graph and still produce similar results?

Some kind of incentivized off chain execution may be feasible for small graphs. Perhaps this computation could be run by validators? The calculation can be verified by users, and if a validator fails to run the computation correctly they can be quickly detrusted.

## Formal Definition

### Definitions

$N$ is the set of all nodes $\{n_1, ..., n_i\}$.

$C_{n_i}$ is the set of all trust connections on $n_i$ $\{c_1, ..., c_j\}$.

### Trust

$B_{n_i}^{c_j}$ is the balance for $c_j$ on $n_i$.

The trust at $n_i$ is $T_{n_i} = \sum_1^j B_{n_i}^{c_j}$.

### Scaling By Distance

$D_{n_i}^{n_j}$ is the distance from $n_i$ to $n_j$.

The distance can be calculated as the length of the shortest path between $n_i$ and $n_j$.

$S_{n_i}^{n_j}$ is the scale factor for $n_j$ from the point of view of $n_i$, and is a function over $D_{n_i}^{n_j}$.

Further thought would be required to select the exact function, but for our purposes it should tend to zero as the distance increases.

### Weighting

The weight for $n_j$ from the point of view of $n_i$ is $W_{n_i}^{n_j} = T_{n_j} \times S_{n_i}^{n_j}$

### Issuance Rate

$V_{n_i}$ is the proposed issuance rate at $n_i$ (vote)

The issuance rate at $n_i$ is $R_{n_i} = \frac{\sum_1^j W_{n_i}^{n_j} \times V_{n_i}}{\sum_1^j W_{n_i}^{n_j}}$
