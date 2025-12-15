import { useState } from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Collapse, Typography, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';

// ----------------------------------------------------------------------

const faqData = [
  {
    id: 1,
    question: 'What are the expected timelines for the campaign?',
    emoji: '🗓️',
    answer: (
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '18px',
          color: '#231F20',
        }}
      >
        Upon receiving the Campaign Brief, our Client Success team will create a list of creators
        that best fit the specified requirements and objectives you set in the Campaign Brief within{' '}
        <Box component="span" sx={{ fontWeight: 600 }}>
          1-2 days
        </Box>{' '}
        of brief confirmation.
        <br />
        <br />
        Once the list of creators have been reviewed and approved by you, our CS will start
        outreaching and onboarding the creators into the Campaign.
        <br />
        <br />
        The Creators are given{' '}
        <Box component="span" sx={{ fontWeight: 600 }}>
          7 days
        </Box>{' '}
        to shoot their content. After the 7 days, you will be able to give feedback for the videos,
        or if you love the Content, you can give the green light for the Content to go live
        immediately!
      </Typography>
    ),
  },
  {
    id: 2,
    question: 'What happens if there are delays?',
    emoji: '⏱️',
    answer: (
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '18px',
          color: '#231F20',
        }}
      >
        We provide a complimentary one-month grace period in the event of client-side delays. Should
        delays extend beyond this timeframe, any unused credits for that period will unfortunately
        be forfeited. We&apos;re unable to issue refunds for work delayed on the client&apos;s end.
        <br />
        <br />
        Our goal at Cult Creative is to help you make full use of your credits within the validity
        window. If you&apos;d like to activate credits after they&apos;ve expired, we can do so with
        a small reactivation fee.
      </Typography>
    ),
  },
  {
    id: 3,
    question: 'How does shortlisting of Creators work?',
    emoji: '👥',
    answer: (
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '18px',
          color: '#231F20',
        }}
      >
        Our Client Success Managers meticulously curate a list of creators for your campaign. We
        follow a{' '}
        <Box component="span" sx={{ fontWeight: 600 }}>
          maximum of three-round process
        </Box>{' '}
        to select the number of Creators you need on a monthly basis.
        <br />
        <br />
        For example, let&apos;s say you chose an Essential Package with 30 credits (assuming each
        credit = 1 creator: 1 deliverable);
        <br />
        <br />
        <Box component="span" sx={{ fontWeight: 600 }}>
          Round 1
        </Box>{' '}
        - We present you with a list of 2x the amount of creators you need a month, so 60 creators
        are presented. If you are agreeable to any 60 from the list, our CS team will proceed with
        outreaching to the selected creators.{' '}
        <Box component="span" sx={{ fontWeight: 600 }}>
          We encourage you to say Yes more!
        </Box>
        <br />
        <Box component="span" sx={{ fontWeight: 600 }}>
          Round 2
        </Box>{' '}
        - We half the amount from Round 1, so 30 creators are added to the list.
        <br />
        <Box component="span" sx={{ fontWeight: 600 }}>
          Round 3
        </Box>{' '}
        - Again, we half the amount from Round 2, so 15 creators are added to the list. This will
        be the last round of shortlisting for the month. You will have to revisit the entire list to
        complete your creators for the month.
        <br />
        <br />
        We highly encourage you to provide feedback on the selection of creators presented to you.
        <br />
        <br />
        <Box component="span" sx={{ fontWeight: 600 }}>
          &apos;Maybe&apos; options will automatically turn into &apos;Yes&apos; options if the
          selection of creators is not finalised after Round 3.
        </Box>
      </Typography>
    ),
  },
  {
    id: 4,
    question: 'What if I want to cross-post?',
    emoji: '🔗',
    answer: (
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '18px',
          color: '#231F20',
        }}
      >
        For cross posting, there are additional charges of{' '}
        <Box component="span" sx={{ fontWeight: 600 }}>
          RM100 per Content
        </Box>
        . These charges are separate from the standard agreement fees and will be included in your
        invoices accordingly.
      </Typography>
    ),
  },
  {
    id: 5,
    question: 'How do I give feedback for the Content?',
    emoji: '📝',
    answer: (
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '18px',
          color: '#231F20',
        }}
      >
        In such cases, clients are encouraged to{' '}
        <Box component="span" sx={{ fontWeight: 600 }}>
          provide feedback
        </Box>{' '}
        in the Deliverables portion of our platform. Our creators will then make the necessary edits
        based on the feedback provided in which they are given{' '}
        <Box component="span" sx={{ fontWeight: 600 }}>
          3-4 days
        </Box>{' '}
        to deliver the edited Content.
        <br />
        <br />
        However, it&apos;s important to note that{' '}
        <Box component="span" sx={{ fontWeight: 600 }}>
          we do not facilitate reshoots
        </Box>{' '}
        if the content aligns with the provisions in the Campaign Brief. We strive to ensure that
        the content meets the specified requirements and objectives laid out at the outset of the
        campaign.
        <br />
        <br />
        <Box component="span" sx={{ fontWeight: 600 }}>
          Our Client Success team carefully balances campaign requirements with creator creativity,
          ensuring content that&apos;s on-brief, on-brand, and culturally resonant
        </Box>
      </Typography>
    ),
  },
  {
    id: 6,
    question: 'What if I want ads?',
    emoji: '📺',
    answer: (
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '18px',
          color: '#231F20',
        }}
      >
        For social media advertisements, there are additional charges of{' '}
        <Box component="span" sx={{ fontWeight: 600 }}>
          RM300 per Content
        </Box>{' '}
        created during the campaign period for a minimum usage of 3 months. These charges are
        separate from the standard agreement fees and will be included in your invoices accordingly.
      </Typography>
    ),
  },
];

// ----------------------------------------------------------------------

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <Box
      sx={{
        width: '100%',
        borderRadius: '16px',
        bgcolor: '#F5F5F5',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        height: isOpen ? 'auto' : 'auto',
        '&:hover': {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onClick={onToggle}
        sx={{
          px: 2,
          py: 2,
          cursor: 'pointer',
          gap: 2,
          minHeight: 78,
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Inter Display, sans-serif',
            fontWeight: 500,
            fontSize: '16px',
            lineHeight: '20px',
            color: '#231F20',
            letterSpacing: '0%',
            flex: 1,
          }}
        >
          {faq.question} {faq.emoji}
        </Typography>
        <IconButton
          size="small"
          sx={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease-in-out',
            color: '#231F20',
          }}
        >
          <Iconify icon="eva:arrow-ios-downward-fill" width={20} />
        </IconButton>
      </Stack>

      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box
          sx={{
            px: 2,
            pb: 3,
            pt: 0,
          }}
        >
          <Box sx={{ mt: 2 }}>{faq.answer}</Box>
        </Box>
      </Collapse>
    </Box>
  );
}

FAQItem.propTypes = {
  faq: PropTypes.shape({
    id: PropTypes.number.isRequired,
    question: PropTypes.string.isRequired,
    emoji: PropTypes.string.isRequired,
    answer: PropTypes.node.isRequired,
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

export default function CampaignFAQ() {
  const [openFaqIds, setOpenFaqIds] = useState([]);

  const handleToggle = (faqId) => {
    setOpenFaqIds((prev) => {
      if (prev.includes(faqId)) {
        return prev.filter((id) => id !== faqId);
      }
      return [...prev, faqId];
    });
  };

  // Split FAQs into left and right columns
  const leftColumnFaqs = faqData.filter((_, index) => index % 2 === 0);
  const rightColumnFaqs = faqData.filter((_, index) => index % 2 !== 0);

  return (
    <Box
      sx={{
        pt: 1,
        pb: 4,
        px: 0,
      }}
    >
      <Typography
        variant="h3"
        sx={{
          fontFamily: 'Instrument Serif, serif',
          fontWeight: 400,
          fontSize: '48px',
          lineHeight: '52px',
          letterSpacing: '0%',
          color: '#231F20',
          mb: 3,
        }}
      >
        Frequently Asked Questions 🤔
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
          gap: 2,
          alignItems: 'start',
        }}
      >
        {/* Left Column */}
        <Stack spacing={2}>
          {leftColumnFaqs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openFaqIds.includes(faq.id)}
              onToggle={() => handleToggle(faq.id)}
            />
          ))}
        </Stack>

        {/* Right Column */}
        <Stack spacing={2}>
          {rightColumnFaqs.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openFaqIds.includes(faq.id)}
              onToggle={() => handleToggle(faq.id)}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}

