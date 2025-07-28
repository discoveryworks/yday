Feature: using yday
  As a Rails core team member working on multiple Rails ecosystem projects
  I want to see what I've been working on recently
  So that I can coordinate releases and track progress across the ecosystem

  Background:
    Given I keep all my repos in `~/workspace`
    And a log of my recent commits can be found in rails_sample

  Scenario: see yesterday's commits during Rails 7.1 release preparation
    Given it's 2023-10-24
    When I run `yday`
    Then I should see
      | Repository               | Commits | Summary                                           |
      | ------------------------ | ------- | --------------------------------------------------|
      | rails                    | 6       | Rails 7.1 release prep and encrypted attributes  |
      | propshaft                | 5       | Asset pipeline optimizations                      |
      | importmap-rails          | 3       | HTTP/2 push support and nested modules           |
      | stimulus-rails           | 3       | Stimulus 3.2 update and controller improvements  |
      | cssbundling-rails        | 3       | Tailwind CSS 3.3 and Docker development fixes   |
      | jsbundling-rails         | 3       | esbuild updates and Bun runtime support          |

  Scenario: see an Alastair chart during active Rails ecosystem development
    Given it's 2023-10-24
    When I run "yday -a"
    Then I should see the message "Alastair timeline for the week beginning Monday, October 23, 2023"
    And I should see

        | MTWRFSs | Project                  | Commits |
        |---------|--------------------------|---------|
        | 6······ | rails                    | 6       |
        | 3······ | hotwire-rails            | 3       |
        | 7······ | solid_cache              | 7       |
        | 4······ | mission_control-jobs     | 4       |
        | 5······ | propshaft                | 5       |
        | 3······ | importmap-rails          | 3       |
        | 3······ | stimulus-rails           | 3       |
        | ······· | turbo-rails              | 7       |
        | 3······ | cssbundling-rails        | 3       |
        | 3······ | jsbundling-rails         | 3       |
        | ······· | actiontext               | 4       |
        | ······· | activestorage            | 5       |
        | ······· | actionmailbox            | 3       |
        | ······· | activejob                | 5       |

  Scenario: see last week's commits on Monday during Rails release week
    Given it's 2023-10-30
    When I run "yday -a"
    Then I should see the message "Alastair timeline for the week beginning Monday, October 23, 2023"
    And I should see

        | MTWRFSs | Project                  | Commits |
        |---------|--------------------------|---------|
        | 6······ | rails                    | 6       |
        | 3······ | hotwire-rails            | 3       |
        | 7······ | solid_cache              | 7       |
        | 4······ | mission_control-jobs     | 4       |
        | 5······ | propshaft                | 5       |
        | 3······ | importmap-rails          | 3       |
        | 3······ | stimulus-rails           | 3       |
        | ··7···· | turbo-rails              | 7       |
        | 3······ | cssbundling-rails        | 3       |
        | 3······ | jsbundling-rails         | 3       |
        | ···4··· | actiontext               | 4       |
        | ···5··· | activestorage            | 5       |
        | ····3·· | actionmailbox            | 3       |
        | ····5·· | activejob                | 5       |