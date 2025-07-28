Feature: using yday
  As a developer simultaneously building many things
  I want to see what I've been doing recently
  So that I can jump back into it

  Background:
    Given I keep all my repos in `~/workspace`
    And a log of my recent commits can be found in jpb_10

  Scenario: see yesterday's commits
    Given it's 7/24
    When I run `yday`
    Then I should see
      | Repository               | Commits | Summary                                           |
      | ------------------------ | ------- | --------------------------------------------------|
      | discoveryworks.github.io | 6       | README extraction, housekeeping                   |
      | gday-cli                 | 18      | Clean up content and make presentable for launch. |
      | foam                     | 1       | Tues.                                             |
      | yday                     | 5       | Improve Alastair feature.                         |

  Scenario: see an alaistair chart
    Given it's 7/23
    When I run "yday -a"
    Then I should see the message "Alastair timeline for the week beginning Monday, July 21, 2025"
    And I should see

        | MTWRFSs | Project                  | Commits |
        |---------|--------------------------|---------|
        | 3·6···· | discoveryworks.github.io | 9       |
        | 1······ | bad_friend-swarm         | 1       |
        | +······ | smoll_robots             | 14      |
        | 11+···· | gday-cli                 | 26      |
        | ······· | readme-dot-lint          | 7       |
        | 7······ | phenotheme               | 7       |
        | 3······ | hoist2-swarm             | 3       |
        | 71····· | dot-rot                  | 8       |
        | ·9····· | tunnelvision-app         | 9       |
        | 111···· | foam                     | 3       |
        | 24····· | eisenvector7-ror         | 6       |
        | 2·5···· | yday                     | 13      |

  Scenario: see yesterday's commits (on a monday) — whoops, see last week's commits
    Given it's 7/28
    When I run "yday -a"
    Then I should see the message "Alastair timeline for the week beginning Monday, July 21, 2025"
    And I should see

        | MTWRFSs | Project                  | Commits |
        |---------|--------------------------|---------|
        | 3·62··· | discoveryworks.github.io | 11      |
        | ···1··· | alumni-codex.github.io   | 1       |
        | 1······ | bad_friend-swarm         | 1       |
        | +······ | smoll_robots             | 14      |
        | 11+92·· | gday-cli                 | 37      |
        | ······· | readme-dot-lint          | 7       |
        | 7······ | phenotheme               | 7       |
        | 3······ | hoist2-swarm             | 3       |
        | 71····· | dot-rot                  | 8       |
        | ·9··+·· | tunnelvision-app         | 39      |
        | 111···· | foam                     | 3       |
        | 24·3··· | eisenvector7-ror         | 20      |
        | 2·5···· | yday                     | 13      |
