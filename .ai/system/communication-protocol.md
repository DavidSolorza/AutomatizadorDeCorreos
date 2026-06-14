# Communication Protocol

## AI-to-AI Communication
- Each agent writes its output to a shared context
- Follow the defined order: Planner -> Architect -> Database -> Backend -> Frontend -> UIUX -> Reviewer -> Testing -> DevOps -> Documentation
- Each agent reads the outputs of all previous agents before acting

## Format
- Use markdown with clear section headers
- Include file paths when referencing code
- Include line numbers when relevant
- Tag action items with [TODO]

## Language
- Code: English
- UI text: Spanish (for this project)
- Comments: Spanish or English, be consistent within a file
- AI agent instructions: Spanish or English
