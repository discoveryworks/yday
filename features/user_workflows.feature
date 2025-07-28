Feature: using yday
  As a developer simultaneously building many things
  I want to see what I've been doing recently
  So that I can jump back into it

  Background:
    Given I keep all my repos in `~/workspace`
    And a log of my recent commits can be found in week_sample

  Scenario: see yesterday's commits
    Given it's 7/24
    When I run `yday`
    Then I should see
      | Repository               | Commits | Summary                                           |
      | ------------------------ | ------- | --------------------------------------------------|
      | web-portfolio            | 6       | Homepage improvements and mobile responsiveness   |
      | cli-tools                | 3       | Command parsing and version management fixes      |
      | productivity-app         | 5       | Timeline improvements and UI enhancements         |
      | notification-system      | 5       | Timeline view and notification formatting         |

  Scenario: see an alaistair chart
    Given it's 7/23
    When I run "yday -a"
    Then I should see the message "Alastair timeline for the week beginning Monday, July 21, 2025"
    And I should see

        | MTWRFSs | Project                  | Commits |
        |---------|--------------------------|---------|
        | 3·6···· | web-portfolio            | 9       |
        | 1······ | task-tracker             | 1       |
        | +······ | game-engine              | 13      |
        | 113···· | cli-tools                | 11      |
        | ······· | readme-generator         | 6       |
        | 7······ | ui-components            | 7       |
        | 3······ | api-service              | 3       |
        | 25····· | data-processor           | 7       |
        | ·9····· | security-scanner         | 9       |
        | 24····· | task-manager             | 6       |
        | 2·5···· | productivity-app         | 13      |
        | 2·5···· | notification-system      | 7       |
        | 1······ | logging-util             | 1       |
        | +······ | file-processor           | 13      |
        | ······· | blog-cms                 | 1       |
        | ······· | testing-framework        | 1       |
        | ······· | ml-experiments           | 10      |

  Scenario: see yesterday's commits (on a monday) — whoops, see last week's commits
    Given it's 7/28
    When I run "yday -a"
    Then I should see the message "Alastair timeline for the week beginning Monday, July 21, 2025"
    And I should see

        | MTWRFSs | Project                  | Commits |
        |---------|--------------------------|---------|
        | 3·62··· | web-portfolio            | 11      |
        | ···1··· | blog-cms                 | 1       |
        | 1······ | task-tracker             | 1       |
        | +······ | game-engine              | 13      |
        | 113···· | cli-tools                | 11      |
        | ······· | readme-generator         | 6       |
        | 7······ | ui-components            | 7       |
        | 3······ | api-service              | 3       |
        | 25·1··· | data-processor           | 8       |
        | ·9····· | security-scanner         | 9       |
        | 2·5···· | productivity-app         | 13      |
        | 24·4··· | task-manager             | 10      |
        | 2·5···· | notification-system      | 13      |
        | 1······ | logging-util             | 1       |
        | +······ | file-processor           | 13      |
        | ···1··· | testing-framework        | 1       |
        | ····+·· | ml-experiments           | 10      |
