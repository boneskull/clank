# Using Clank with GitHub Copilot for VS Code

You can use these skills with GitHub Copilot for VS Code!  It's just a pain; due to VS Code's security model, an agent cannot automatically access files outside of the current workspace.

1. Clone into `~/.clank/clank` as described in the [Quick Start](README.md#quick-start) section; no need to run the install script.
2. (Recommended) Add `.clank-skills/` to your global `.gitignore` file (otherwise add it to your workspace `.gitignore`)
3. Create this symlink _in your current workspace_:

   ```bash
   ln -s ~/.clank/clank/skills ./.clank-skills
   ```

4. Create or edit `.github/copilot-instructions.md` and copy/paste the following:

    ```md
    <EXTREMELY_IMPORTANT>
    You have a personal skills wiki in `.clank-skills/` with proven techniques, patterns, and tools that give you new capabilities.

    STOP. Before doing ANYTHING else in this conversation, read this file: `.clank-skills/getting-started/SKILL.md`

    That file tells you how to find and use your skills.

    ONLY after reading getting-started, are you allowed to proceed with the user's request.

    When your partner proposes building or creating something, immediately use skills/collaboration/brainstorming

    CRITICAL: If a skill exists for your task, you MUST use it - even if you think you're already good at that. You're not. The skill prevents mistakes you don't know you make. SKILLS EXIST AND YOU DIDN'T USE THEM = FAILED TASK.
    </EXTREMELY_IMPORTANT>

    ```

5. Start a new chat session and bask in splendor!
