@text @properties
Feature: Text properties and shared appearance
  As a designer
  I want text controls to use the existing design system
  So that every accepted change updates the real Canvas text

  Background:
    Given an existing Text object is selected

  Scenario: Discover text through consistent icons
    When I inspect the toolbar and the selected object's Layers row
    Then both should display the shared T SVG icon
    When I select the Text toolbar button
    Then Text should become the active tool

  Scenario: Arrange typography using shared property controls
    When I inspect Typography
    Then the font-family dropdown should occupy a full row
    And font style and font size should share a row
    And line height and letter spacing should share a row
    And their icons should be vertically centered in the shared inputs
    And font size should use themed increment and decrement controls
    And native number-input spinner controls should not be visible

  Scenario: Select a font from the dropdown
    When I choose an available font family from the font menu
    Then the canonical font family should change
    And Canvas should render the selected font
    And Undo should restore the previous font and rendered appearance

  Scenario Outline: Apply typography to actual text
    When I accept a valid change to "<parameter>"
    Then the corresponding canonical typography value should change
    And the Canvas text should reflect that value
    And one Undo should restore the previous value and Canvas appearance
    And Redo should restore the accepted change

    Examples:
      | parameter      |
      | content        |
      | font size      |
      | font weight    |
      | font style     |
      | line height    |
      | letter spacing |
      | alignment      |

  Scenario: Apply combined font style as one action
    When I choose Bold Italic
    Then font weight should be bold and font style should be italic
    And one Undo should restore both previous values

  Scenario: Cancel or reject a typography draft
    When I change a field draft and press Escape
    Then its previous canonical value should remain unchanged
    When I enter an invalid numeric value
    Then the previous valid canonical value and rendering should remain unchanged

  Scenario: Reuse the complete Fill component
    When I inspect Fill for text and for a shape
    Then both should use the same Fill section, rows, picker, opacity and visibility controls
    And both should provide the same add and remove controls
    And text paint should be stored in canonical fills rather than typography color

  Scenario Outline: Apply a complete Fill operation to text
    When I "<operation>" using the shared Fill controls
    Then canonical fills and Canvas glyph appearance should reflect the change
    And one Undo should restore the previous fills and exact Canvas appearance
    And Redo should restore the change

    Examples:
      | operation             |
      | change the color      |
      | change opacity        |
      | hide a fill           |
      | show a hidden fill    |
      | add a fill layer      |
      | remove a fill layer   |

  Scenario Outline: Clip gradient paint to text glyphs
    When I select a "<kind>" gradient using the shared Fill picker
    Then the gradient should appear inside the actual text glyphs
    And the text box background should remain unpainted
    And fill opacity should affect the gradient
    And Undo should restore the previous Canvas appearance

    Examples:
      | kind    |
      | linear  |
      | radial  |
      | angular |
      | diamond |

  Scenario: Preserve legacy text colors through durable edits
    Given a saved text document uses the original typography color field
    When the document is opened
    Then its color should migrate to canonical Fill records without changing appearance
    When I change fill opacity and wait for durable storage
    And I reload the document
    Then the changed opacity and rendered appearance should be preserved
