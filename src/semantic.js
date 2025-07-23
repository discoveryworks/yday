class Semantic {
  analyze(gitData) {
    const { parentDir, repos } = gitData;
    
    const analyzedRepos = repos.map(repo => ({
      name: repo.name,
      path: repo.path,
      commits: repo.commitCount,
      summary: this.generateSummary(repo.commits, repo.name)
    }));
    
    return {
      parentDir,
      repos: analyzedRepos
    };
  }

  generateSummary(commits, projectName) {
    if (!commits || commits.length === 0) {
      return "No meaningful commits";
    }
    
    // Extract messages from commit objects (handle both old string format and new object format)
    const commitMessages = commits.map(commit => 
      typeof commit === 'string' ? commit : commit.message
    );
    
    // Clean up messages: remove noise and standardize format
    const cleanMessages = this.cleanCommitMessages(commitMessages);
    
    if (cleanMessages.length === 0) {
      return "No meaningful commits";
    }
    
    // Analyze commit patterns to understand the story
    const commitTypes = this.extractCommitTypes(cleanMessages);
    const keyFeatures = this.extractKeyFeatures(cleanMessages);
    
    // Build story summary based on analysis
    const primaryAction = this.determinePrimaryAction(commitTypes);
    const primaryFeature = keyFeatures[0];
    
    let storySummary = "";
    
    if (primaryFeature) {
      storySummary = `${primaryAction} ${primaryFeature}`;
      
      // Add secondary features if they exist and are different
      const secondary = keyFeatures[1];
      if (secondary && secondary !== primaryFeature) {
        storySummary = `${storySummary} & ${secondary}`;
      }
    } else {
      // Fall back to extracting meaningful terms
      const meaningfulTerms = this.extractMeaningfulTerms(cleanMessages);
      
      if (meaningfulTerms.length > 0) {
        storySummary = `${primaryAction} ${meaningfulTerms.join(', ')}`;
      } else {
        // Last resort: use the most descriptive commit message
        const bestCommit = this.findBestCommitMessage(cleanMessages);
        
        if (bestCommit) {
          storySummary = bestCommit.replace(/^[a-z]*:/, '').trim().substring(0, 30);
        } else {
          storySummary = "Code changes";
        }
      }
    }
    
    // Clean and format the final summary
    storySummary = this.cleanAndCapitalize(storySummary);
    
    // Limit length and return
    if (storySummary.length > 35) {
      return storySummary.substring(0, 32) + "...";
    }
    
    return storySummary;
  }

  cleanCommitMessages(messages) {
    return messages
      .map(msg => msg
        .replace(/^Merge pull request.*$/, '')
        .replace(/^Merge branch.*$/, '')
        .replace(/^WIP\s*:/, '')
        .replace(/^[Ff]ix\s*:/g, 'fix:')
        .replace(/^[Aa]dd\s*:/g, 'add:')
        .replace(/^[Uu]pdate\s*:/g, 'update:')
        .replace(/^[Ff]eat\s*:/g, 'feat:')
        .replace(/^[Ff]eature\s*:/g, 'feat:')
        .trim()
      )
      .filter(msg => msg.length > 0);
  }

  extractCommitTypes(cleanMessages) {
    const typeCount = {};
    
    cleanMessages.forEach(msg => {
      const typeMatch = msg.match(/^([a-z]+):/);
      if (typeMatch) {
        const type = typeMatch[1];
        typeCount[type] = (typeCount[type] || 0) + 1;
      }
    });
    
    // Return sorted by frequency
    return Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .map(([type]) => type);
  }

  extractKeyFeatures(cleanMessages) {
    const featurePattern = /\b(auth|login|user|api|database|test|ui|component|service|model|controller|config|deploy|docker|security|payment|notification|search|mobile|performance|documentation|integration)\w*\b/gi;
    const featureCount = {};
    
    cleanMessages.forEach(msg => {
      const matches = msg.match(featurePattern);
      if (matches) {
        matches.forEach(match => {
          const feature = match.toLowerCase();
          featureCount[feature] = (featureCount[feature] || 0) + 1;
        });
      }
    });
    
    // Return top 3 features sorted by frequency
    return Object.entries(featureCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([feature]) => feature);
  }

  determinePrimaryAction(commitTypes) {
    if (!commitTypes || commitTypes.length === 0) {
      return "Working on";
    }
    
    const primaryType = commitTypes[0];
    
    switch (primaryType) {
      case 'feat':
        return "Building";
      case 'fix':
        return "Fixing";
      case 'refactor':
        return "Refactoring";
      case 'update':
        return "Updating";
      case 'add':
        return "Adding";
      case 'chore':
        return "Maintaining";
      default:
        return "Working on";
    }
  }

  extractMeaningfulTerms(cleanMessages) {
    const stopWords = new Set([
      'this', 'that', 'with', 'from', 'into', 'have', 'been', 'were', 'will',
      'your', 'they', 'when', 'what', 'also', 'some', 'work', 'more', 'file',
      'code', 'line', 'text', 'data', 'info', 'item', 'part', 'side', 'main',
      'full', 'very', 'most', 'many', 'much', 'less', 'same', 'each', 'only',
      'just', 'good', 'best', 'make', 'made', 'need', 'want', 'take', 'come',
      'know', 'think', 'look', 'find', 'give', 'keep', 'turn', 'move', 'show',
      'help', 'call', 'might', 'could', 'would', 'should', 'still', 'after',
      'before', 'where', 'there', 'here', 'back', 'down', 'over', 'such',
      'being', 'doing', 'going'
    ]);
    
    const termCount = {};
    
    cleanMessages.forEach(msg => {
      const words = msg.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
      words.forEach(word => {
        if (!stopWords.has(word)) {
          termCount[word] = (termCount[word] || 0) + 1;
        }
      });
    });
    
    // Return top 2 terms sorted by frequency
    return Object.entries(termCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([term]) => term);
  }

  findBestCommitMessage(cleanMessages) {
    // Find a commit message that's descriptive but not too long
    return cleanMessages.find(msg => {
      const withoutType = msg.replace(/^[a-z]*:/, '').trim();
      return withoutType.length > 10 && withoutType.length < 50;
    });
  }

  cleanAndCapitalize(text) {
    // Clean up whitespace and capitalize first letter
    const cleaned = text.replace(/\s+/g, ' ').trim();
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }
}

module.exports = Semantic;