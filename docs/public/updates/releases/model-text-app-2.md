# Modeled Text App 2

This is a modeled exercise, not a shipped npm release. Source and integrity
identify the retained upstream candidate; the guide defines the App-only wire
contract. This record does not establish registry or release-range availability.

Read [the complete three-stage guide](../text-cross-version-example-3.md) and
follow the predecessor and prerequisite records from [history](../history.md).

```release-summary
{
  "id": "model-text-app-2",
  "owner": "@fixture/text-app",
  "channel": "npm",
  "status": "modeled",
  "previous": "model-text-app-1",
  "target": {
    "sourceSha": "7bf3655242e6adca9ac7d81ff57d17df9b310c9e",
    "version": "model-2",
    "integrity": "sha256-60ba8503161a1f88adfbe17a5c136e4d202df987b07b14452a3b4e9047db32b7"
  },
  "requires": [
    "model-text-framework"
  ],
  "evidence": [
    "https://github.com/karote00/asyra/blob/7bf3655242e6adca9ac7d81ff57d17df9b310c9e/packages/preset/src/props/components/text-component.ts"
  ],
  "changes": [
    {
      "change": "model-text-app-2",
      "summary": "Resume deferred shared spacing default adoption",
      "impact": "integration",
      "reason": "Modeled exercise only; inspect actual adoption and preserve custom fields and data.",
      "guides": [
        "updates/text-cross-version-example-3.md"
      ]
    }
  ],
  "guideHashes": {
    "updates/text-cross-version-example-3.md": "227135e30355aa0843af0bc853f678cdfa5e803094521cbd01622989273b5592"
  }
}
```

## Canonical sources

- [Cross-version integration contract](../text-cross-version-example-3.md)
