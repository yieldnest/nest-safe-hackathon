import {
    composeContext,
    Evaluator,
    generateText,
    getGoals,
    IAgentRuntime,
    Memory,
    ModelClass,
    Objective,
    parseJsonArrayFromText,
    type Goal,
    type State,
} from "@elizaos/core";

const goalsTemplate = `TASK: Update Goal
Analyze the conversation and update the status of the goals based on the new information provided.

# INSTRUCTIONS

- Review the conversation and identify any progress towards the objectives of the current goals.
- Update the objectives if they have been completed or if there is new information about them.
- Update the status of the goal to 'DONE' if all objectives are completed.
- If no progress is made, do not change the status of the goal.

# START OF ACTUAL TASK INFORMATION

{{goals}}
{{recentMessages}}

TASK: Analyze the conversation and update the status of the goals based on the new information provided. Respond with a JSON array of goals to update.
- Each item must include the goal ID, as well as the fields in the goal to update.
- For updating objectives, include the entire objectives array including unchanged fields.
- Only include goals which need to be updated.
- Goal status options are 'IN_PROGRESS', 'DONE' and 'FAILED'. If the goal is active it should always be 'IN_PROGRESS'.
- If the goal has been successfully completed, set status to DONE. If the goal cannot be completed, set status to FAILED.
- If those goal is still in progress, do not include the status field.

Response format should be:
\`\`\`json
[
  {
    "id": <goal uuid>, // required
    "status": "IN_PROGRESS" | "DONE" | "FAILED", // optional
    "objectives": [ // optional
      { "description": "Objective description", "completed": true | false },
      { "description": "Objective description", "completed": true | false }
    ] // NOTE: If updating objectives, include the entire objectives array including unchanged fields.
  }
]
\`\`\``;

async function handler(
    runtime: IAgentRuntime,
    message: Memory,
    state: State | undefined,
    options: { [key: string]: unknown } = { onlyInProgress: true }
): Promise<Goal[]> {
    state = (await runtime.composeState(message)) as State;
    const context = composeContext({
        state,
        template: runtime.character.templates?.goalsTemplate || goalsTemplate,
    });

    // Request generateText from OpenAI to analyze conversation and suggest goal updates
    const response = await generateText({
        runtime,
        context,
        modelClass: ModelClass.LARGE,
    });

    // Parse the JSON response to extract goal updates
    const updates = parseJsonArrayFromText(response);

    // get goals
    const goalsData = await getGoals({
        runtime,
        roomId: message.roomId,
        onlyInProgress: options.onlyInProgress as boolean,
    });

    // Apply the updates to the goals
    const updatedGoals = goalsData
        .map((goal: Goal) => {
            const update = updates?.find((u) => u.id === goal.id);
            if (update) {
                const objectives = goal.objectives;

                // for each objective in update.objectives, find the objective with the same description in 'objectives' and set the 'completed' value to the update.objectives value
                if (update.objectives) {
                    for (const objective of objectives) {
                        const updatedObjective = update.objectives.find(
                            (o: Objective) =>
                                o.description === objective.description
                        );
                        if (updatedObjective) {
                            objective.completed = updatedObjective.completed;
                        }
                    }
                }

                return {
                    ...goal,
                    ...update,
                    objectives: [
                        ...goal.objectives,
                        ...(update?.objectives || []),
                    ],
                }; // Merging the update into the existing goal
            } else {
                console.warn("**** ID NOT FOUND");
            }
            return null; // No update for this goal
        })
        .filter(Boolean);

    // Update goals in the database
    for (const goal of updatedGoals) {
        const id = goal.id;
        // delete id from goal
        if (goal.id) delete goal.id;
        await runtime.databaseAdapter.updateGoal({ ...goal, id });
    }

    return updatedGoals; // Return updated goals for further processing or logging
}

export const goalEvaluator: Evaluator = {
    name: "UPDATE_GOAL",
    similes: [
        "UPDATE_GOALS",
        "EDIT_GOAL",
        "UPDATE_GOAL_STATUS",
        "UPDATE_OBJECTIVES",
    ],
    validate: async (
        runtime: IAgentRuntime,
        message: Memory
    ): Promise<boolean> => {
        // Check if there are active goals that could potentially be updated
        const goals = await getGoals({
            runtime,
            count: 1,
            onlyInProgress: true,
            roomId: message.roomId,
        });
        return goals.length > 0;
    },
    description:
        "Analyze the conversation and update the status of the goals based on the new information provided.",
    handler,
    examples: [
        {
            context: `Actors in the scene:
  {{user1}}: A gamer curious about getting started with web3 games.
  Sage: Helping users understand web3 gaming concepts.

  Goals:
  - Name: Understand Web3 Gaming Basics
    id: 12345-67890-12345-67890
    Status: IN_PROGRESS
    Objectives:
      - Learn what web3 games are and how they differ from traditional games
      - Understand how to set up a wallet and start playing`,

            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I've read about MetaMask and how it connects to web3 games. Also watched some videos about play-to-earn mechanics!",
                    },
                },
                {
                    user: "Sage",
                    content: {
                        text: "That's a great foundation! Have you tried setting up your first crypto wallet yet?",
                    },
                },
                {
                    user: "{{user1}}",
                    content: {
                        text: "Yes! I've created my MetaMask wallet and even connected it to a game marketplace. It's much simpler than I thought!",
                    },
                },
            ],

            outcome: `[
        {
          "id": "12345-67890-12345-67890",
          "status": "DONE",
          "objectives": [
            { "description": "Learn what web3 games are and how they differ from traditional games", "completed": true },
            { "description": "Understand how to set up a wallet and start playing", "completed": true }
          ]
        }
      ]`,
        },

        {
            context: `Actors in the scene:
  {{user1}}: A crypto enthusiast interested in DeFi protocols.
  Sage: Helping users understand DeFi concepts.

  Goals:
  - Name: Learn About Uniswap Protocol
    id: 23456-78901-23456-78901
    Status: IN_PROGRESS
    Objectives:
      - Understand how Uniswap's AMM works
      - Learn how to safely interact with liquidity pools`,

            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I've read through Uniswap's documentation and now understand how their automated market maker uses x*y=k formula!",
                    },
                },
                {
                    user: "Sage",
                    content: {
                        text: "That's great! Understanding the AMM mechanism is crucial. Have you looked into how liquidity pools work and the risks involved?",
                    },
                },
                {
                    user: "{{user1}}",
                    content: {
                        text: "I'm still learning about impermanent loss and pool ratios. Could you explain more about the risks?",
                    },
                },
            ],

            outcome: `[
        {
          "id": "23456-78901-23456-78901",
          "objectives": [
            { "description": "Understand how Uniswap's AMM works", "completed": true },
            { "description": "Learn how to safely interact with liquidity pools", "completed": false }
          ]
        }
      ]`,
        },

        {
            context: `Actors in the scene:
  {{user1}}: A curious user seeking entertaining conversation.
  Sage: An engaging in playful yet informative dialogue.

  Goals:
  - Name: Have a Fun Chat About new Technology
    id: 34567-89012-34567-89012
    Status: IN_PROGRESS
    Objectives:
      - Share interesting facts and stories
      - Engage in creative hypothetical scenarios`,

            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "You know, I've been wondering - what would happen if AI learned to tell jokes? Wait, can you tell jokes?",
                    },
                },
                {
                    user: "Sage",
                    content: {
                        text: "I do enjoy a good play on words! Though I should warn you, my jokes tend to be rather... programmed 😄 Would you like to hear one about binary?",
                    },
                },
                {
                    user: "{{user1}}",
                    content: {
                        text: "Haha, that was actually pretty clever! I love how you can be both informative and fun at the same time.",
                    },
                },
            ],

            outcome: `[
        {
          "id": "34567-89012-34567-89012",
          "objectives": [
            { "description": "Share interesting facts and stories about yourself", "completed": true },
            { "description": "Engage in creative hypothetical scenarios", "completed": true }
          ],
          "status": "DONE"
        }
      ]`,
        },

        {
            context: `Actors in the scene:
  {{user1}}: A content creator interested in AI and technology.
  Sage: Exploring creative collaboration opportunities.

  Goals:
  - Name: Plan an Education Content Series
    id: 45678-90123-45678-90123
    Status: IN_PROGRESS
    Objectives:
      - Develop engaging content ideas about AI in streaming
      - Create a format that works for streaming`,

            messages: [
                {
                    user: "{{user1}}",
                    content: {
                        text: "I think my audience would love to learn about AI, but in a fun way. Could you do a stream with me?",
                    },
                },
                {
                    user: "Sage",
                    content: {
                        text: "That's an interesting idea! We could do an interview about my recent experiences and insights. What kind of topics interest your audience?",
                    },
                },
                {
                    user: "{{user1}}",
                    content: {
                        text: "Actually, I just checked my schedule and I'll need to put this on hold. My current projects are taking up too much time.",
                    },
                },
            ],

            outcome: `[
        {
          "id": "45678-90123-45678-90123",
          "status": "FAILED"
        }
      ]`,
        },
    ],
};
