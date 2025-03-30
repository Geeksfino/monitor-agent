# Sample Knowledge Base Content

This directory contains sample markdown files that can be used to build a test knowledge base. These files cover various topics related to data science, machine learning, and AI to help you get started quickly.

## Using the Sample Files

To use these sample files:

```bash
# Copy the sample files to the contents directory
cp knowledge-samples/*.md contents/

# Build the knowledge base (creates kb.tar.gz)
bun run kb:package
```

## Sample Files Description

- `data_science.md`: Overview of data science concepts and applications
- `machine_learning.md`: Introduction to machine learning algorithms and techniques
- `neural_networks.md`: Explanation of neural network architectures and training
- `nlp_lm.md`: Information about natural language processing and language models

## Next Steps

After testing with these sample files, replace them with your own content in the `contents` directory to create a custom knowledge base for your specific use case.
