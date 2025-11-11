# Akash Network Deployment Guide

This guide explains how to deploy DeepSeek V3 and Llama 3 70B on Akash Network for fully decentralized AI inference.

## Prerequisites

1. **Akash CLI** installed
2. **Akash wallet** with AKT tokens (~$200 for initial deployment)
3. **Keplr wallet** (for managing Akash account)

## Installation

### 1. Install Akash CLI

```bash
# Linux/Mac
curl -sSfL https://raw.githubusercontent.com/akash-network/node/master/install.sh | sh

# Verify installation
akash version
```

### 2. Create Akash Wallet

```bash
# Create new wallet
akash keys add sovereign-agent

# Save the mnemonic phrase securely!
# Fund wallet with AKT tokens from exchange
```

### 3. Set Environment Variables

```bash
export AKASH_NODE=https://rpc.akash.forbole.com:443
export AKASH_CHAIN_ID=akashnet-2
export AKASH_KEYRING_BACKEND=os
export AKASH_KEY_NAME=sovereign-agent
export AKASH_GAS=auto
export AKASH_GAS_ADJUSTMENT=1.5
export AKASH_GAS_PRICES=0.025uakt
export AKASH_SIGN_MODE=amino-json
```

## Deployment Steps

### Deploy DeepSeek V3

```bash
# 1. Create deployment
akash tx deployment create deploy/akash-deepseek.yaml \
  --from $AKASH_KEY_NAME \
  --node $AKASH_NODE \
  --chain-id $AKASH_CHAIN_ID \
  --gas-prices $AKASH_GAS_PRICES \
  --gas $AKASH_GAS \
  --gas-adjustment $AKASH_GAS_ADJUSTMENT

# 2. Get deployment ID (DSEQ)
akash query deployment list --owner $(akash keys show $AKASH_KEY_NAME -a)

# 3. View bids
akash query market bid list --owner $(akash keys show $AKASH_KEY_NAME -a)

# 4. Accept a bid (choose provider with best price/specs)
akash tx market lease create \
  --dseq <DSEQ> \
  --provider <PROVIDER_ADDRESS> \
  --from $AKASH_KEY_NAME

# 5. Get lease status
akash query market lease list --owner $(akash keys show $AKASH_KEY_NAME -a)

# 6. Get service URI
akash provider lease-status \
  --dseq <DSEQ> \
  --from $AKASH_KEY_NAME \
  --provider <PROVIDER_ADDRESS>

# 7. Test endpoint
curl https://<DEPLOYMENT_URI>/v1/models
```

### Deploy Llama 3 70B

```bash
# Same steps as above, but use akash-llama.yaml
akash tx deployment create deploy/akash-llama.yaml \
  --from $AKASH_KEY_NAME \
  --node $AKASH_NODE \
  --chain-id $AKASH_CHAIN_ID
```

## Cost Breakdown

### DeepSeek V3 (4x A100 GPUs)
- **Monthly cost:** ~$100-150
- **Specs:** 16 CPU, 64GB RAM, 4x A100 GPUs, 700GB storage
- **Performance:** ~20-30 tokens/second

### Llama 3 70B (2x A100 GPUs)
- **Monthly cost:** ~$50-75
- **Specs:** 8 CPU, 32GB RAM, 2x A100 GPUs, 450GB storage
- **Performance:** ~40-60 tokens/second

### Total Monthly Cost
- **Both models:** ~$150-225/month
- **Compare to AWS:** $3,000-5,000/month for same specs
- **Savings:** 95%+ cost reduction

## Monitoring

### Check Deployment Status

```bash
# List all deployments
akash query deployment list --owner $(akash keys show $AKASH_KEY_NAME -a)

# Get logs
akash provider lease-logs \
  --dseq <DSEQ> \
  --from $AKASH_KEY_NAME \
  --provider <PROVIDER_ADDRESS>

# Check service health
curl https://<DEPLOYMENT_URI>/health
```

### Update Deployment

```bash
# Update deployment config
akash tx deployment update deploy/akash-deepseek.yaml \
  --dseq <DSEQ> \
  --from $AKASH_KEY_NAME
```

### Close Deployment

```bash
# Close deployment (stops billing)
akash tx deployment close \
  --dseq <DSEQ> \
  --from $AKASH_KEY_NAME
```

## Integration with Backend

Update your `.env` file with the Akash deployment URIs:

```env
DEEPSEEK_ENDPOINT=https://<DEEPSEEK_DEPLOYMENT_URI>
LLAMA_ENDPOINT=https://<LLAMA_DEPLOYMENT_URI>
```

Test the integration:

```bash
# Test DeepSeek
curl https://<DEEPSEEK_DEPLOYMENT_URI>/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-v3",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'

# Test Llama
curl https://<LLAMA_DEPLOYMENT_URI>/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-3-70b",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Troubleshooting

### Deployment Fails

```bash
# Check deployment events
akash query deployment get --owner $(akash keys show $AKASH_KEY_NAME -a) --dseq <DSEQ>

# Check provider logs
akash provider lease-logs --dseq <DSEQ> --from $AKASH_KEY_NAME --provider <PROVIDER_ADDRESS>
```

### No Bids Received

- Increase pricing in YAML file
- Check if requested GPU model is available
- Try different GPU models (A6000, RTX 4090)

### Out of Memory

- Reduce `MAX_MODEL_LEN` in YAML
- Reduce `GPU_MEMORY_UTILIZATION`
- Increase GPU count

## Security

### API Key Protection

The Akash deployments are publicly accessible. To secure them:

1. **Use API Gateway:** Route requests through your backend
2. **Add Authentication:** Implement token-based auth in backend
3. **Rate Limiting:** Prevent abuse with rate limits

### Wallet Security

- **Never share your mnemonic phrase**
- **Use hardware wallet** for mainnet deployments
- **Keep separate wallets** for testnet and mainnet

## Scaling

### Horizontal Scaling

```yaml
deployment:
  deepseek-v3:
    dcloud:
      profile: deepseek-v3
      count: 3  # Deploy 3 instances
```

### Load Balancing

Use your backend to distribute requests across multiple Akash deployments.

## Cost Optimization

1. **Use Spot Pricing:** Accept lower-priced bids
2. **Scale Down Off-Peak:** Close deployments during low usage
3. **Use Smaller Models:** Switch to Llama 3 8B for simple tasks
4. **Batch Requests:** Combine multiple requests to reduce overhead

## Support

- **Akash Discord:** https://discord.gg/akash
- **Akash Docs:** https://docs.akash.network
- **Provider Status:** https://akashnet.info/providers

## Next Steps

1. Deploy both models to Akash
2. Update backend `.env` with deployment URIs
3. Test API endpoints
4. Monitor costs and performance
5. Optimize based on usage patterns
