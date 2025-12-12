interface ExampleCommandsProps {
  onCommandClick: (command: string) => void;
}

export function ExampleCommands({ onCommandClick }: ExampleCommandsProps) {
  const examples = [
    {
      category: 'Create Tokens',
      commands: [
        'Create a token with read scope for bob',
        'Create a token for alice with write and admin scopes',
        'Generate a token for bob with read access'
      ]
    },
    {
      category: 'List/View Tokens',
      commands: [
        'List all tokens',
        'Show tokens for bob',
        'Show all tokens',
        'Show me all tokens for alice'
      ]
    },
    {
      category: 'Manage Tokens',
      commands: [
        'Update token_bob with admin scope',
        'Refresh token_alice for 2 weeks',
        'Check status of token_bob',
        'Revoke token_alice'
      ]
    }
  ];

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-700">Try these examples:</div>

      {examples.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {group.category}
          </div>
          <div className="flex flex-wrap gap-2">
            {group.commands.map((command, cmdIndex) => (
              <button
                key={cmdIndex}
                onClick={() => onCommandClick(command)}
                className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
              >
                {command}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}