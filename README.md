# Knowledge Graph Visualizer

An interactive knowledge graph visualization tool for exploring scientific concepts and research ideas.

## Features

- **Interactive Graph Visualization** - Explore concept relationships using Sigma.js
- **Multiple Domains** - Switch between different scientific domains
- **Search** - Find specific concepts quickly
- **Ideas View** - Browse and compare research ideas with scores
- **Node Details** - Click on nodes to see detailed information

## Usage

Simply open `index.html` in a web browser.

Or use a local server:
```bash
npx serve .
```

## Data

The `data/` directory contains:
- `{domain}_graph.json` - Knowledge graph data for each domain
- `{domain}_ideas_with_papers.json` - Research ideas with related papers
