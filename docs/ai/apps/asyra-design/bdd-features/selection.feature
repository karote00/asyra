Feature: Element Selection
  As a user
  I want to select and deselect elements
  So that I can edit the correct target

  Scenario: Select a single element from canvas
    Given there is an element on canvas
    And I have the "Select" tool selected
    When I click on that element
    Then the element should be selected

  Scenario: Deselect by clicking empty canvas
    Given an element is selected
    When I click empty canvas area
    Then no element should remain selected

  Scenario: Drag empty canvas to area select
    Given there are elements on canvas
    And I have the "Select" tool selected
    When I drag an empty canvas area covering the elements
    Then the elements inside the dragged area should be selected

  Scenario: Drag selected element to move
    Given an element is selected on canvas
    When I drag from the selected element to a new position
    Then the selected element should update its canvas position

  Scenario: Drag unselected unlocked element to move
    Given an unlocked element exists on canvas and is not selected
    When I drag from that unlocked element to a new position
    Then that element should become selected
    And that element should update its canvas position

  Scenario: Select from contents panel
    Given an element exists in the contents panel
    When I click the element row
    Then that element should be selected

  Scenario: Deselect from contents panel empty area
    Given an element is selected
    When I click empty area in contents panel
    Then no element should remain selected

  Scenario: Hover element on canvas
    Given there is an element on canvas
    When I move mouse over the element's visible geometry
    Then that element should become the hovered target

  Scenario: Keep element hover stable while dragging across another element
    Given element A is the hovered drag target
    And element B is elsewhere on canvas
    When I drag element A across element B without releasing the pointer
    Then element B should not become the hovered target during the drag
    And element A should remain the hovered target during the drag

  Scenario Outline: Enter one child level by double-clicking a container
    Given the Select tool is active and no path is being edited
    And a selected <container> contains a nested container with a visible unlocked vector
    When I double-click the vector's visible geometry without modifiers
    Then only the immediate child of the selected container should be selected
    And the same double-click should not enter vector path editing
    And the document geometry and hierarchy should remain unchanged
    Examples:
      | container                         |
      | Group                             |
      | Frame                             |
      | registered type inheriting Group  |

  Scenario: Repeated double-clicks enter nested containers one level at a time
    Given a selected outer Group contains an inner Group containing a vector
    When I double-click the vector's visible geometry
    Then the inner Group should be selected
    When I double-click the vector's visible geometry again
    Then the vector should be selected without entering path editing
    When I double-click the selected vector again
    Then the existing vector path editing behavior should run

  Scenario: Choose the frontmost child at the pointer
    Given a selected Group has two overlapping visible unlocked children
    When I double-click their overlapping visible geometry
    Then only the frontmost child should be selected

  Scenario Outline: Reject unavailable child targets
    Given a single container is selected
    When a double-click resolves to <target>
    Then the drill-down action should leave selection unchanged
    Examples:
      | target                              |
      | no child at that position           |
      | the container itself                |
      | an element outside the container    |
      | a locked or hidden child            |
      | a missing or invalid hierarchy      |

  Scenario: Preserve existing interaction modes
    Given another drawing tool or path editing is active, or a selection modifier is held
    When I double-click on a container
    Then container drill-down should not take over that interaction
