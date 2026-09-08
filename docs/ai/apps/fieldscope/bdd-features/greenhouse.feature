Feature: Greenhouse configuration and crop inspection
  Scenario: Default planted greenhouse
    Given the default four-bay configuration
    When the scene is built
    Then each water surface is 5 cm below soil
    And soil forms the semicircular channel below the water
    And the left two bays contain 2976 cucumber plants
    And the right two bays contain 2976 tomato plants
    And each cultivar uses all 20 visual variants

  Scenario: Reversible layout edit
    Given an accepted greenhouse configuration
    When a valid dimensional draft is applied
    Then one history entry replaces the complete scene
    When Undo and Redo are used
    Then each accepted scene and deterministic crop arrangement is restored

  Scenario: View-only interaction
    Given a planted greenhouse
    When the camera moves or a crop layer is toggled
    Then no crop geometry is regenerated

  Scenario: Invalid root clearance
    Given soil too narrow for the pole inset plus 5 cm
    When the configuration is applied
    Then validation rejects the edit without changing the scene or history
