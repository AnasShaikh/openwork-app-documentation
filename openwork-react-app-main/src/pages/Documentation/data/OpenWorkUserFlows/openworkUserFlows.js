// User Flow Visualization Data for OpenWork
// Based on accurate contract documentation
// Each flow shows what a user can do and the function calls involved

export const userFlows = {
  // ==================== JOB FLOWS ====================
  'post-job': {
    id: 'post-job',
    title: 'Post a Job',
    category: 'Jobs',
    description: 'Create a new job with milestone-based payments. Job data syncs to Native chain via LayerZero while USDC escrow happens at job start.',
    icon: '📝',
    userAction: 'Job giver creates a freelance job with defined milestones',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Local (OP/ETH/Base)',
        contract: 'LOWJC',
        function: 'postJob(jobDetailHash, descriptions[], amounts[], nativeOptions)',
        action: 'Create job with milestones',
        details: 'Generates unique jobId (chainId-counter), creates job locally with Open status, NO USDC escrowed yet',
        dataFlow: 'IPFS hash + milestone data'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Local',
        contract: 'Local Bridge',
        function: 'sendToNativeChain(payload, options)',
        action: 'Package message for LayerZero',
        details: 'Encodes job data into LayerZero message format'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Cross-chain',
        contract: 'LayerZero V2',
        function: '_lzSend()',
        action: 'Route message to Native chain',
        details: 'DVN validators verify and route message to Arbitrum'
      },
      {
        step: 4,
        actor: 'System',
        chain: 'Native (Arbitrum)',
        contract: 'Native Bridge',
        function: '_lzReceive(origin, payload)',
        action: 'Receive and route message',
        details: 'Validates source, routes to NOWJC based on function name'
      },
      {
        step: 5,
        actor: 'System',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'postJob(jobId, jobGiver, hash, descriptions, amounts)',
        action: 'Store job in Genesis',
        details: 'Creates canonical job record with Open status, visible on all chains'
      }
    ],
    result: 'Job created with Open status, visible everywhere, ready for applications',
    fees: 'LayerZero messaging fee (~0.001 ETH)',
    timeEstimate: '~30 seconds'
  },

  'apply-to-job': {
    id: 'apply-to-job',
    title: 'Apply to Job',
    category: 'Jobs',
    description: 'Freelancer submits application with proposed milestones and preferred payment chain.',
    icon: '📤',
    userAction: 'Freelancer applies to an open job with their proposal',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Local',
        contract: 'LOWJC',
        function: 'applyToJob(jobId, appHash, descriptions[], amounts[], preferredChainDomain, options)',
        action: 'Submit application',
        details: 'Creates application with proposed milestones and preferred payment chain (CCTP domain)'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Local',
        contract: 'Local Bridge',
        function: 'sendToNativeChain()',
        action: 'Send application cross-chain'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'applyToJob(applicant, jobId, appHash, descriptions, amounts, chainDomain)',
        action: 'Store application',
        details: 'Adds applicant to job, stores proposed milestones and payment preferences'
      }
    ],
    result: 'Application submitted, job giver can review and select winner',
    fees: 'LayerZero fee only'
  },

  'start-job': {
    id: 'start-job',
    title: 'Start Job (Accept Applicant)',
    category: 'Jobs',
    description: 'Job giver accepts an application, chooses milestone structure, and escrows first milestone USDC.',
    icon: '▶️',
    userAction: 'Job giver selects winning applicant and funds first milestone',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Local',
        contract: 'USDC',
        function: 'approve(lowjcAddress, firstMilestoneAmount)',
        action: 'Approve USDC for escrow',
        details: 'Job giver approves first milestone amount for CCTP transfer'
      },
      {
        step: 2,
        actor: 'User',
        chain: 'Local',
        contract: 'LOWJC',
        function: 'startJob(jobId, appId, useAppMilestones, options)',
        action: 'Accept application and lock funds',
        details: 'Selects applicant, chooses their milestones or original, sends USDC via CCTP'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Local',
        contract: 'CCTP Transceiver',
        function: 'sendFast(amount, domain, recipient)',
        action: 'Burn USDC on local chain',
        details: 'USDC burned, Circle generates attestation'
      },
      {
        step: 4,
        actor: 'System',
        chain: 'Native',
        contract: 'CCTP',
        function: 'receiveMessage()',
        action: 'Mint USDC on Arbitrum',
        details: 'USDC minted to NOWJC for escrow'
      },
      {
        step: 5,
        actor: 'System',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'startJob(jobGiver, jobId, appId, useAppMilestones)',
        action: 'Update job status',
        details: 'Sets status to InProgress, currentMilestone to 1, stores finalMilestones'
      }
    ],
    result: 'Job InProgress, first milestone funded, freelancer can start work',
    fees: 'LayerZero fee + CCTP (~$0.50 USDC)'
  },

  'submit-work': {
    id: 'submit-work',
    title: 'Submit Work',
    category: 'Jobs',
    description: 'Freelancer submits completed work for current milestone.',
    icon: '📦',
    userAction: 'Freelancer uploads deliverables and notifies job giver',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Local',
        contract: 'LOWJC',
        function: 'submitWork(jobId, submissionHash, options)',
        action: 'Submit deliverable',
        details: 'IPFS hash contains deliverable files, screenshots, documentation'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'submitWork(applicant, jobId, submissionHash)',
        action: 'Record submission',
        details: 'Adds submission to job, emits WorkSubmitted event with milestone number'
      }
    ],
    result: 'Work submitted, job giver can review and release payment',
    fees: 'LayerZero fee only'
  },

  'release-payment': {
    id: 'release-payment',
    title: 'Release Milestone Payment',
    category: 'Jobs',
    description: 'Job giver approves work and releases payment to freelancer on their preferred chain.',
    icon: '💸',
    userAction: 'Job giver reviews work and releases payment cross-chain',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Local',
        contract: 'LOWJC',
        function: 'releasePaymentCrossChain(jobId, targetDomain, recipient, options)',
        action: 'Release payment to freelancer',
        details: 'Specifies target chain (freelancer preference) and recipient address'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'releasePaymentCrossChain(jobGiver, jobId, amount, domain, recipient)',
        action: 'Process payment release',
        details: 'Validates milestone amount, calculates 1% commission (min $1)'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'calculateCommission(amount)',
        action: 'Deduct platform fee',
        details: 'Commission = max(1%, $1 USDC), accumulated in treasury'
      },
      {
        step: 4,
        actor: 'System',
        chain: 'Native',
        contract: 'CCTP Transceiver',
        function: 'sendFast(netAmount, targetDomain, recipient)',
        action: 'Send USDC cross-chain',
        details: 'Burns USDC on Arbitrum, mints on target chain to freelancer'
      },
      {
        step: 5,
        actor: 'System',
        chain: 'Native',
        contract: 'Native Rewards',
        function: 'processJobPayment(jobGiver, jobTaker, amount, platformTotal)',
        action: 'Calculate OW token rewards',
        details: 'Awards OW tokens: 80% to job giver, 10% to each referrer'
      },
      {
        step: 6,
        actor: 'System',
        chain: 'Target',
        contract: 'CCTP',
        function: 'receiveMessage()',
        action: 'Mint USDC to freelancer',
        details: 'Freelancer receives payment on their preferred chain'
      }
    ],
    result: 'Milestone paid, OW tokens awarded, milestone incremented (or job completed if final)',
    fees: 'LayerZero fee + 1% commission (min $1)'
  },

  'direct-contract': {
    id: 'direct-contract',
    title: 'Start Direct Contract',
    category: 'Jobs',
    description: 'Create and immediately start a job with a pre-selected freelancer, skipping application process.',
    icon: '🤝',
    userAction: 'Job giver creates job directly with known freelancer',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Local',
        contract: 'USDC',
        function: 'approve(lowjcAddress, firstMilestoneAmount)',
        action: 'Approve USDC'
      },
      {
        step: 2,
        actor: 'User',
        chain: 'Local',
        contract: 'LOWJC',
        function: 'startDirectContract(jobTaker, jobDetailHash, descriptions[], amounts[], jobTakerChainDomain, options)',
        action: 'Create and start job in one tx',
        details: 'Creates job, auto-application, immediately sets InProgress, escrows first milestone'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'handleStartDirectContract(...)',
        action: 'Create job + application + start',
        details: 'Emits JobPosted, JobApplication, JobStarted, JobStatusChanged in sequence'
      }
    ],
    result: 'Job created and started immediately, freelancer can begin work',
    fees: 'LayerZero fee + CCTP'
  },

  // ==================== DISPUTE FLOWS ====================
  'raise-dispute': {
    id: 'raise-dispute',
    title: 'Raise Dispute',
    category: 'Disputes',
    description: 'Job participant raises dispute when work quality is contested or payment is unfair.',
    icon: '⚖️',
    userAction: 'User initiates dispute with evidence and pays dispute fee',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Local',
        contract: 'USDC',
        function: 'approve(athenaClientAddress, disputeFee)',
        action: 'Approve dispute fee (min 50 USDC)'
      },
      {
        step: 2,
        actor: 'User',
        chain: 'Local',
        contract: 'Athena Client',
        function: 'raiseDispute(jobId, disputeHash, oracleName, feeAmount, disputedAmount, options)',
        action: 'Submit dispute',
        details: 'IPFS hash contains evidence, reasoning; oracleName targets skill oracle'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Local',
        contract: 'Athena Client',
        function: 'routeFeeToNative(feeAmount)',
        action: 'Route fee via CCTP',
        details: 'Burns USDC on local chain, mints to Native Athena on Arbitrum'
      },
      {
        step: 4,
        actor: 'System',
        chain: 'Local',
        contract: 'Local Bridge',
        function: 'sendToNativeChain()',
        action: 'Send dispute data via LayerZero'
      },
      {
        step: 5,
        actor: 'System',
        chain: 'Native',
        contract: 'Native Athena',
        function: 'handleRaiseDispute(caller, jobId, hash, oracle, fee, amount, sourceChain)',
        action: 'Create dispute',
        details: 'Validates job exists, stores dispute, initiates voting period'
      }
    ],
    result: 'Dispute created, oracle voting period begins',
    fees: 'Min 50 USDC dispute fee + LayerZero fee'
  },

  'vote-on-dispute': {
    id: 'vote-on-dispute',
    title: 'Vote on Dispute',
    category: 'Disputes',
    description: 'Eligible oracle members vote on dispute outcome.',
    icon: '🗳️',
    userAction: 'Oracle member casts vote on dispute',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Native',
        contract: 'Native Athena',
        function: 'vote(disputeId, voteFor, claimAddress)',
        action: 'Cast vote',
        details: 'voteFor=true means job giver wins, claimAddress receives fee share if on winning side'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Native',
        contract: 'Native Athena',
        function: 'Internal: validate eligibility',
        action: 'Check voting eligibility',
        details: 'Checks: oracle membership, staked tokens (via Native DAO), or earned tokens (100+ OW)'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Native',
        contract: 'Native Athena',
        function: 'Internal: calculate voting power',
        action: 'Calculate vote weight',
        details: 'Voting power = (stakeAmount × duration) + earnedTokens'
      }
    ],
    result: 'Vote recorded with calculated voting power',
    fees: 'Gas only (~45K)'
  },

  'settle-dispute': {
    id: 'settle-dispute',
    title: 'Settle Dispute',
    category: 'Disputes',
    description: 'Finalize dispute after voting period, distribute fees to winners, release funds.',
    icon: '✅',
    userAction: 'Anyone can call settle after voting period ends',
    steps: [
      {
        step: 1,
        actor: 'User/System',
        chain: 'Native',
        contract: 'Native Athena',
        function: 'settleDispute(disputeId)',
        action: 'Finalize dispute',
        details: 'Validates voting period ended, calculates winning side based on vote totals'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Native',
        contract: 'Native Athena',
        function: 'Internal: distribute fees',
        action: 'Calculate fee distribution',
        details: 'Fees distributed proportionally to winning voters based on voting power'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'releaseDisputedFunds(recipient, amount, targetDomain)',
        action: 'Release escrowed funds',
        details: 'Sends funds to winner via CCTP (1% commission deducted)'
      },
      {
        step: 4,
        actor: 'System',
        chain: 'Cross-chain',
        contract: 'LayerZero',
        function: 'sendToLocalChain()',
        action: 'Send resolution to origin chain'
      },
      {
        step: 5,
        actor: 'System',
        chain: 'Local',
        contract: 'Athena Client',
        function: 'handleFinalizeDisputeWithVotes(...)',
        action: 'Finalize on local chain',
        details: 'Records votes locally, auto-calls LOWJC.resolveDispute()'
      },
      {
        step: 6,
        actor: 'System',
        chain: 'Local',
        contract: 'LOWJC',
        function: 'resolveDispute(jobId, jobGiverWins)',
        action: 'Update job status',
        details: 'Marks job Completed, clears locked amount'
      }
    ],
    result: 'Dispute resolved, funds released to winner, fees distributed to winning voters',
    fees: 'Gas only for settle call'
  },

  // ==================== REWARDS FLOWS ====================
  'earn-rewards': {
    id: 'earn-rewards',
    title: 'Earn OW Token Rewards',
    category: 'Rewards',
    description: 'Automatically earn OW tokens when payments are released (20-band progressive system).',
    icon: '🏆',
    userAction: 'Automatic when job giver releases payment',
    steps: [
      {
        step: 1,
        actor: 'System',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'releasePaymentCrossChain()',
        action: 'Payment released',
        details: 'Triggers reward calculation'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Native',
        contract: 'Native Rewards',
        function: 'processJobPayment(jobGiver, jobTaker, amount, platformTotal)',
        action: 'Calculate rewards',
        details: 'Gets current band rate (e.g., Band 1 = 300 OW/USDT), looks up referrers'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Native',
        contract: 'Native Rewards',
        function: '_awardTokensInCurrentBand()',
        action: 'Award tokens (LOCKED)',
        details: 'Job giver: 80-100%, Job giver referrer: 10%, Job taker referrer: 10%. All LOCKED initially'
      }
    ],
    result: 'OW tokens earned but LOCKED until governance participation',
    note: 'Band rates: Band 1-2: 300 OW/USDT, Band 3: 150 OW/USDT, decreasing to ~0.01 OW/USDT'
  },

  'unlock-rewards': {
    id: 'unlock-rewards',
    title: 'Unlock Rewards (Governance)',
    category: 'Rewards',
    description: 'Unlock earned tokens by participating in governance (voting/proposing).',
    icon: '🔓',
    userAction: 'User votes on proposals or disputes to unlock tokens',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Main/Native',
        contract: 'Main DAO / Native Athena',
        function: 'castVote() or vote()',
        action: 'Participate in governance',
        details: 'Vote on proposal (Main DAO) or dispute (Native Athena)'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'incrementGovernanceAction(user)',
        action: 'Record governance action'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Native',
        contract: 'Native Rewards',
        function: 'recordGovernanceAction(user)',
        action: 'Unlock tokens',
        details: 'Each action unlocks = current band rate worth of tokens (e.g., 300 OW in Band 1)'
      }
    ],
    result: 'Tokens unlocked proportional to governance participation',
    note: 'Example: 3000 OW earned in Band 1 → need 10 governance actions (10 × 300) to unlock all'
  },

  'sync-rewards': {
    id: 'sync-rewards',
    title: 'Sync Rewards to Main Chain',
    category: 'Rewards',
    description: 'Sync claimable token balance from Native to Main chain for claiming.',
    icon: '🔄',
    userAction: 'User syncs claimable balance before claiming',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Native',
        contract: 'NOWJC',
        function: 'syncRewardsData(options)',
        action: 'Initiate sync',
        details: 'Queries Native Rewards for claimable amount'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Native',
        contract: 'Native Rewards',
        function: 'getUserTotalClaimableTokens(user)',
        action: 'Calculate claimable',
        details: 'Sums claimable across all bands (earned - claimed, limited by governance actions)'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Cross-chain',
        contract: 'Native Bridge → Main Bridge',
        function: 'LayerZero message',
        action: 'Send claimable amount'
      },
      {
        step: 4,
        actor: 'System',
        chain: 'Main (Base/ETH)',
        contract: 'Main Rewards',
        function: 'handleSyncClaimableRewards(user, claimableAmount, sourceChain)',
        action: 'Store claimable balance',
        details: 'Overwrites user claimable balance'
      }
    ],
    result: 'Claimable balance now available on Main chain',
    fees: 'LayerZero fee'
  },

  'claim-rewards': {
    id: 'claim-rewards',
    title: 'Claim OW Tokens',
    category: 'Rewards',
    description: 'Withdraw earned and unlocked OW tokens on Main chain.',
    icon: '💰',
    userAction: 'User claims available OW tokens',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Main',
        contract: 'Main Rewards',
        function: 'claimRewards(options)',
        action: 'Claim tokens',
        details: 'Requires synced balance > 0'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Main',
        contract: 'Main Rewards',
        function: 'Internal: transfer',
        action: 'Transfer OW tokens',
        details: 'Resets claimable to 0, updates totalClaimed, transfers OW to user'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Cross-chain',
        contract: 'Main Bridge → Native Bridge',
        function: 'sendToNativeChain()',
        action: 'Send claim confirmation'
      },
      {
        step: 4,
        actor: 'System',
        chain: 'Native',
        contract: 'Native Rewards',
        function: 'markTokensClaimed(user, amount)',
        action: 'Update claimed records',
        details: 'Prevents double claiming'
      }
    ],
    result: 'OW tokens in user wallet, records updated on both chains',
    fees: 'LayerZero fee for confirmation'
  },

  // ==================== GOVERNANCE FLOWS ====================
  'stake-tokens': {
    id: 'stake-tokens',
    title: 'Stake OW Tokens',
    category: 'Governance',
    description: 'Stake OW tokens with time-lock multipliers for voting power.',
    icon: '🔒',
    userAction: 'User locks OW tokens for governance participation',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Main',
        contract: 'OW Token',
        function: 'approve(mainDAOAddress, amount)',
        action: 'Approve tokens'
      },
      {
        step: 2,
        actor: 'User',
        chain: 'Main',
        contract: 'Main DAO',
        function: 'stake(amount, durationMinutes)',
        action: 'Stake tokens',
        details: 'Durations: 1 week (1x), 1 month (1.5x), 3 months (2x), 6 months (3x), 1 year (5x)'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Main',
        contract: 'Main Rewards',
        function: 'sendStakeUpdateCrossChain()',
        action: 'Relay stake to Native'
      },
      {
        step: 4,
        actor: 'System',
        chain: 'Native',
        contract: 'Native DAO',
        function: 'updateStakeData()',
        action: 'Store stake data',
        details: 'Enables local eligibility checks for disputes'
      }
    ],
    result: 'Voting power = stakeAmount × durationMultiplier, available immediately',
    note: 'Example: 500 OW × 6 months (3x) = 1500 voting power'
  },

  'create-proposal': {
    id: 'create-proposal',
    title: 'Create DAO Proposal',
    category: 'Governance',
    description: 'Create governance proposal for community voting (requires 100+ OW staked or earned).',
    icon: '📋',
    userAction: 'User creates proposal for DAO vote',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Main',
        contract: 'Main DAO',
        function: 'propose(targets[], values[], calldatas[], description)',
        action: 'Submit proposal',
        details: 'Requires canPropose() = true (100+ OW from stake or rewards)'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Main',
        contract: 'Main DAO',
        function: 'Internal: record governance action',
        action: 'Record participation',
        details: 'Unlocks rewards tokens'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Cross-chain',
        contract: 'Main Bridge',
        function: 'sendToNativeChain()',
        action: 'Notify Native of governance action'
      }
    ],
    result: 'Proposal created, voting period begins',
    requirements: '100 OW minimum (staked or earned)'
  },

  'vote-proposal': {
    id: 'vote-proposal',
    title: 'Vote on Proposal',
    category: 'Governance',
    description: 'Cast vote on active DAO proposal using staked + earned voting power.',
    icon: '🗳️',
    userAction: 'User votes for/against/abstain on proposal',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Main',
        contract: 'Main DAO',
        function: 'castVote(proposalId, support)',
        action: 'Cast vote',
        details: 'support: 0=Against, 1=For, 2=Abstain'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Main',
        contract: 'Main DAO',
        function: '_getVotes()',
        action: 'Calculate voting power',
        details: 'Total = (stakeAmount × duration) + delegatedPower + earnedTokens'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Cross-chain',
        contract: 'Main Bridge',
        function: 'sendToNativeChain()',
        action: 'Record governance action on Native'
      }
    ],
    result: 'Vote recorded, governance action unlocks reward tokens',
    requirements: '50 OW minimum for voting'
  },

  'delegate-votes': {
    id: 'delegate-votes',
    title: 'Delegate Voting Power',
    category: 'Governance',
    description: 'Delegate voting power to trusted community member while keeping token ownership.',
    icon: '🤲',
    userAction: 'User delegates their voting power',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Native',
        contract: 'Native DAO',
        function: 'delegate(delegateeAddress)',
        action: 'Delegate voting power',
        details: 'Transfers voting rights, keeps token ownership'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Native',
        contract: 'OpenworkGenesis',
        function: 'Internal: update delegation',
        action: 'Store delegation',
        details: 'Increases delegatee power, removes delegator power'
      }
    ],
    result: 'Delegatee can vote with delegator\'s power, delegator cannot vote while delegated',
    note: 'Can undelegate() anytime to reclaim voting rights'
  },

  // ==================== PROFILE FLOWS ====================
  'create-profile': {
    id: 'create-profile',
    title: 'Create Profile',
    category: 'Profile',
    description: 'Create user profile with optional referrer for earning referral bonuses.',
    icon: '👤',
    userAction: 'User creates profile before posting or applying to jobs',
    steps: [
      {
        step: 1,
        actor: 'User',
        chain: 'Local',
        contract: 'LOWJC',
        function: 'createProfile(ipfsHash, referrerAddress, options)',
        action: 'Create profile',
        details: 'IPFS hash contains name, bio, skills; referrer gets 10% bonus on user\'s earnings'
      },
      {
        step: 2,
        actor: 'System',
        chain: 'Native',
        contract: 'Profile Manager',
        function: 'createProfile()',
        action: 'Store profile on Native',
        details: 'Stores in ProfileGenesis'
      },
      {
        step: 3,
        actor: 'System',
        chain: 'Main',
        contract: 'Main Rewards',
        function: 'handleCreateProfile(user, referrer)',
        action: 'Store referrer on Main',
        details: 'Enables referral tracking for rewards'
      }
    ],
    result: 'Profile created, referrer relationship established across chains',
    note: 'Required before posting jobs or applying'
  }
};

// Flow categories for UI grouping
export const flowCategories = {
  Jobs: {
    name: 'Job Flows',
    description: 'Complete job lifecycle from posting to payment',
    icon: '💼',
    color: '#3B82F6',
    flows: ['post-job', 'apply-to-job', 'start-job', 'submit-work', 'release-payment', 'direct-contract']
  },
  Disputes: {
    name: 'Dispute Flows',
    description: 'Raise and resolve disputes with oracle voting',
    icon: '⚖️',
    color: '#EF4444',
    flows: ['raise-dispute', 'vote-on-dispute', 'settle-dispute']
  },
  Rewards: {
    name: 'Rewards Flows',
    description: 'Earn, unlock, and claim OW tokens',
    icon: '🏆',
    color: '#10B981',
    flows: ['earn-rewards', 'unlock-rewards', 'sync-rewards', 'claim-rewards']
  },
  Governance: {
    name: 'Governance Flows',
    description: 'Stake, propose, vote, and delegate',
    icon: '🏛️',
    color: '#8B5CF6',
    flows: ['stake-tokens', 'create-proposal', 'vote-proposal', 'delegate-votes']
  },
  Profile: {
    name: 'Profile Flows',
    description: 'Create and manage user profiles',
    icon: '👤',
    color: '#F59E0B',
    flows: ['create-profile']
  }
};

// Chain information for visualization
export const chainInfo = {
  local: {
    name: 'Local Chain',
    examples: ['Ethereum', 'OP', 'Base', 'Polygon'],
    description: 'User-facing chains where users interact',
    color: '#627EEA'
  },
  native: {
    name: 'Native Chain',
    examples: ['Arbitrum'],
    description: 'Central hub for job state, escrow, and rewards',
    color: '#28A0F0'
  },
  main: {
    name: 'Main Chain',
    examples: ['Base (testnet)', 'Ethereum (mainnet)'],
    description: 'Token distribution and main governance',
    color: '#0052FF'
  },
  crosschain: {
    name: 'Cross-chain',
    examples: ['LayerZero V2', 'CCTP'],
    description: 'Message and fund transfer protocols',
    color: '#9CA3AF'
  }
};

// Key contracts summary
export const keyContracts = {
  LOWJC: { chain: 'local', role: 'User entry point for jobs' },
  NOWJC: { chain: 'native', role: 'Central job management and payments' },
  'Local Bridge': { chain: 'local', role: 'LayerZero messaging' },
  'Native Bridge': { chain: 'native', role: 'Message routing hub' },
  'CCTP Transceiver': { chain: 'all', role: 'USDC cross-chain transfers' },
  'Athena Client': { chain: 'local', role: 'Dispute entry point' },
  'Native Athena': { chain: 'native', role: 'Dispute resolution and voting' },
  'Native Rewards': { chain: 'native', role: 'Token calculation engine' },
  'Main Rewards': { chain: 'main', role: 'Token claiming hub' },
  'Native DAO': { chain: 'native', role: 'Local governance mirror' },
  'Main DAO': { chain: 'main', role: 'Main governance and staking' },
  OpenworkGenesis: { chain: 'native', role: 'Persistent data storage' }
};

export default userFlows;
