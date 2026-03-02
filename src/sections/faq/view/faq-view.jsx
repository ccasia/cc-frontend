import { useState } from 'react';
import PropTypes from 'prop-types';

import { Box, Stack, Collapse, Container, Typography, IconButton } from '@mui/material';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

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
          letterSpacing: '0%',
          color: '#8E8E93',
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
    question: 'How does shortlisting of Creators work?',
    emoji: '👥',
    answer: (
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '18px',
          letterSpacing: '0%',
          color: '#8E8E93',
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
    id: 3,
    question: 'How do I give feedback for the Content?',
    emoji: '📝',
    answer: (
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '18px',
          letterSpacing: '0%',
          color: '#8E8E93',
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
    id: 4,
    question: 'What happens if there are delays?',
    emoji: '⏱️',
    answer: (
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '18px',
          letterSpacing: '0%',
          color: '#8E8E93',
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
    id: 5,
    question: 'What if I want to cross-post?',
    emoji: '🔗',
    answer: (
      <Typography
        sx={{
          fontFamily: 'Inter Display, sans-serif',
          fontWeight: 400,
          fontSize: '14px',
          lineHeight: '18px',
          letterSpacing: '0%',
          color: '#8E8E93',
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
          letterSpacing: '0%',
          color: '#8E8E93',
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
        bgcolor: 'white',
        overflow: 'hidden',
        transition: 'all 0.3s ease-in-out',
        mb: 2,
        '&:hover': {
          bgcolor: '#FAFAFA',
        },
      }}
    >
      {/* Question Section with Blue Border */}
      <Box
        sx={{
          borderLeft: '3px solid #1340FF',
          pl: 2,
          pr: 2,
          py: 2,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          onClick={onToggle}
          sx={{
            cursor: 'pointer',
            gap: 2,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontWeight: 400,
                fontSize: '40px',
                lineHeight: '44px',
                letterSpacing: '0%',
                color: '#1340FF',
                minWidth: '50px',
              }}
            >
              Q
            </Typography>
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
          </Stack>
          <IconButton
            size="small"
            sx={{
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease-in-out',
              color: '#231F20',
            }}
          >
            <Iconify icon="eva:arrow-ios-forward-fill" width={24} />
          </IconButton>
        </Stack>
      </Box>

      {/* Answer Section with Gray Border */}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Box
          sx={{
            borderLeft: '3px solid #636366',
            pl: 2,
            pr: 2,
            pb: 2,
          }}
        >
          <Stack direction="row" alignItems="start" spacing={2}>
            <Typography
              sx={{
                fontFamily: 'Instrument Serif, serif',
                fontWeight: 400,
                fontSize: '40px',
                lineHeight: '44px',
                letterSpacing: '0%',
                color: '#636366',
                minWidth: '50px',
              }}
            >
              A
            </Typography>
            <Box sx={{ flex: 1, pt: 1 }}>{faq.answer}</Box>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
}

FAQItem.propTypes = {
  faq: PropTypes.shape({
    question: PropTypes.string.isRequired,
    emoji: PropTypes.string.isRequired,
    answer: PropTypes.node.isRequired,
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

// ----------------------------------------------------------------------

export default function FaqView() {
  const settings = useSettingsContext();
  const [openFaqIds, setOpenFaqIds] = useState([]);

  const handleToggle = (faqId) => {
    setOpenFaqIds((prev) => {
      if (prev.includes(faqId)) {
        return prev.filter((id) => id !== faqId);
      }
      return [...prev, faqId];
    });
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Box
        sx={{
          pt: 3,
          pb: 4,
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
            mb: 4,
          }}
        >
          Frequently Asked Questions 🤔
        </Typography>

        <Stack spacing={0}>
          {faqData.map((faq) => (
            <FAQItem
              key={faq.id}
              faq={faq}
              isOpen={openFaqIds.includes(faq.id)}
              onToggle={() => handleToggle(faq.id)}
            />
          ))}
        </Stack>
      </Box>
    </Container>
  );
}

