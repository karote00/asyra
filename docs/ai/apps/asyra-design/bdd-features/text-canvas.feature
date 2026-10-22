@text @canvas
Feature: Canvas plain-text authoring
  As a designer
  I want to create and edit text directly on Canvas
  So that manual and AI-created text remain ordinary editable document objects

  Scenario: Create text at an insertion point
    Given the Text tool is active
    When I click empty Canvas
    Then a focused plain-text editor with a caret should open at that position
    When I enter "Hello" and finish editing
    Then one canonical Text object containing "Hello" should be selected
    And Select should become the active tool
    And one Undo should remove the created object
    And Redo should restore its content, geometry and fills

  Scenario: Create a text box by dragging
    Given the Text tool is active
    When I drag a nonzero rectangle on Canvas
    Then the editor should keep the chosen layout width and fit its content height
    When I enter multiline text and finish editing
    Then Canvas should render the content using that box and ordinary text wrapping
    And one Undo should remove the entire creation

  Scenario: Treat small pointer movement as a click
    Given the Text tool is active
    When I press and release within the existing creation movement threshold
    Then I should enter the insertion-point creation route
    And no degenerate text box should be committed

  Scenario Outline: Discard an unfinished new object
    Given I started a new Canvas text editor
    When I "<action>"
    Then no Text object should be added to the document
    And no document Undo entry should be added
    And no orphan editor should remain

    Examples:
      | action                       |
      | cancel with Escape           |
      | finish with no text          |

  Scenario: Edit existing text in place
    Given an unlocked visible Text object with existing typography and fills
    When I double-click that text
    Then a focused editor should show its existing content
    When I replace its content and finish editing
    Then that same object should contain the new plain text
    And its typography and fills should be preserved
    And its layout box should follow its saved sizing mode
    And one Undo should restore the original content

  Scenario: Cancel only the current editing session
    Given I completed one text edit and started a second edit
    When I change the second draft and press Escape
    Then the first completed edit should remain
    And no additional document Undo entry should be added

  Scenario: Keep an existing object when its text becomes empty
    Given I am editing an existing Text object
    When I remove all characters and finish editing
    Then the same object should remain with empty content
    And one Undo should restore the previous content

  Scenario: Enter Unicode and literal plain text
    Given the Canvas text editor has focus
    When I enter Traditional Chinese, emoji, newlines and HTML-looking text
    Then the content should remain literal plain text
    And Enter should insert a newline
    And the platform command modifier with Enter should finish editing

  Scenario: Preserve IME composition ownership
    Given the Canvas editor is composing Traditional Chinese input
    When Enter or a tool shortcut key is received during composition
    Then the editor should retain focus and the composing text
    And no tool switch, object deletion or document commit should occur
    When composition finishes and I explicitly finish editing
    Then the composed text should be committed once

  Scenario: Keep text keyboard actions inside the editor
    Given the Canvas text editor has focus
    When I use select-all, clipboard, deletion, Undo or Redo
    Then the text editor should own that action
    And document selection, objects and history should not receive it
    And T and V should be text characters

  Scenario: Commit before acting outside the editor
    Given I have a changed Canvas text draft
    When I click a property control or another tool
    Then the text edit should finish once
    And the clicked control should perform its normal action
    And a subsequent property change should be a separate Undo action

  Scenario: Preserve Canvas alignment
    Given an existing Text object is rotated inside a transformed parent
    When I edit it at a changed viewport zoom and pan
    Then the editor should follow the object's full Canvas transform
    And finishing should preserve position and rotation and commit the measured dimensions

  Scenario: Reject unavailable editing targets
    Given a Text object is hidden or locked
    When I attempt to edit it
    Then no editor or document mutation should be created

  Scenario: End a stale editor safely
    Given an existing Text object is being edited
    When the target is deleted, locked or changed outside the editor
    Then the stale draft must not overwrite the current document
    And the input should expose an accessible unavailable-target error
    And the draft should remain available for copying or cancelling with Escape

  Scenario: Dispose transient editing state
    Given a Canvas text session is open
    When the document or Canvas host is replaced
    Then the session, input handlers and editor should be disposed
    And transient editor state should not appear in saved document data

  Scenario: Preserve edits after save and reload
    Given I completed a Canvas text edit
    When the document is durably saved and reloaded
    Then content, typography, fills and geometry should be preserved
    And the text should remain editable from the properties panel and Canvas

  Scenario: Preserve group navigation before editing nested text
    Given a Group containing Text is selected
    When I double-click its text child
    Then the ordinary group child-selection action should select that Text
    And the text editor should not bypass that hierarchy step
    When I double-click the selected Text again
    Then the text editor should open

  Scenario: Keep the scene visible while entering text
    Given the Canvas text editor has focus
    When I enter a text draft
    Then the editor background should remain transparent
    And the underlying Canvas scene should remain visible through the text box

  Scenario: Size point text from its content
    Given I click Canvas with the Text tool
    Then the empty editor should occupy only a caret and one line
    When I type a longer line
    Then the editor width should grow without wrapping
    When I delete characters or insert an explicit newline
    Then its width and height should follow the current content
    When I finish editing
    Then the canonical layout box should equal the last editor layout box
    And reopening or reloading should preserve content-based sizing

  Scenario: Size dragged text vertically within its chosen width
    Given I drag a text box on Canvas
    When I enter enough text to wrap
    Then its width should remain the dragged width
    And its height should grow and shrink with its wrapped lines
    When I finish editing
    Then the canonical layout box should equal the last editor layout box
    And reopening should retain fixed-width sizing

  Scenario Outline: Leave an empty Text tool session
    Given I press T
    And I "<entry>"
    When I leave without entering text
    Then no Text object or document Undo entry should remain
    And no text editor should remain

    Examples:
      | entry                      |
      | select a different tool    |
      | click to open an editor    |
      | drag to open an editor     |

  Scenario: Replace the original glyph projection while editing
    Given an existing Text object has a visible Fill
    When I replace its content in the Canvas editor
    Then only the current draft should be visible at that position
    And the original glyphs and stale selection outline should not overlap it
    And the canonical text and document Undo history should remain unchanged
    When I cancel editing
    Then the original text and Fill should be visible again

  Scenario: Keep text editing free of a bottom hint
    Given the Canvas text editor has focus
    Then no bottom editing hint or close-editor button should appear
    And Enter, the platform command modifier with Enter, and Escape should retain their editing behavior
    When the editing target becomes stale
    Then no bottom hint or close-editor button should appear
    And the stale draft must not overwrite the document

  Scenario: Preserve prepared AI text admission
    Given an AI design draft contains text with explicit width and height
    When the backend prepares it and the browser admits it
    Then its typography should include the canonical fixed sizing default
    And applying the design should create the text with its declared dimensions
    And supported sizing values should pass the same semantic and canonical validation
    And unsupported sizing values should be rejected

  Scenario: Publish Canvas drafts immediately without a second content editor
    Given an existing Text object is selected
    Then the Property Panel should have no Content section or content input
    When I type in the Canvas editor without finishing the edit
    Then system draft subscribers should immediately receive the current text and measured box
    And Canvas should display the current draft and retain keyboard focus
    And canonical text and document Undo history should remain unchanged
    When I cancel the draft
    Then the system draft should be cleared and Canvas should show the original text
    When I edit again and finish
    Then Canvas should show the committed text
    And one Undo should restore the original text
    And Redo should restore the accepted text
