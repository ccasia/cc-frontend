/* eslint-disable react/prop-types */
import dayjs from 'dayjs';
import { Page, Text, View, Font, Link, Image, Document, StyleSheet } from '@react-pdf/renderer';

Font.register({
  family: 'EB Garamond',
  fonts: [
    {
      src: '/fonts/germond/EBGaramond-Medium.ttf',
    },
    {
      src: '/fonts/germond/EBGaramond-Bold.ttf',
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#F4F4F4',
    padding: 40,
    fontFamily: 'EB Garamond',
    position: 'relative',
  },
  image: {
    width: 100,
    height: 40,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.5,
    fontFamily: 'EB Garamond',
    fontWeight: 800,
    fontSize: 13,
    marginTop: 30,
  },
  line: {
    marginVertical: 10,
    height: 1,
    backgroundColor: '#000',
    marginTop: 20,
  },
  section: {
    marginBottom: 15,
    fontSize: 12,
    marginTop: 20,
  },
  titlee: {
    fontSize: 14,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  list: {
    marginLeft: 20,
    marginTop: 15,
  },
  item: {
    marginBottom: 5,
  },
  bold: {
    fontWeight: 'bold',
  },
  paymentView: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    fontSize: 12,
  },
  signatureView: {
    display: 'flex',
    marginTop: 10,
    flexDirection: 'row',
    gap: 150,
    fontSize: 14,
  },

  signatureChild: {
    display: 'flex',
    flexDirection: 'row',
    gap: 5,
  },

  version: {
    position: 'absolute',
    color: 'grey',
    fontSize: 12,
    bottom: 30,
    right: 30,
  },
});

export default function AgreementTemplate({
  DATE,
  IC_NUMBER,
  FREELANCER_FULL_NAME,
  ADDRESS,
  ccEmail,
  ccPhoneNumber,
  effectiveDate,
  creatorPayment,
  CREATOR_NAME,
  CREATOR_ACCOUNT_NUMBER,
  CREATOR_BANK_ACCOUNT_NAME,
  CREATOR_BANK_NAME,
  AGREEMENT_ENDDATE,
  NOW_DATE,
  VERSION_NUMBER = 'V1',
  ADMIN_IC_NUMBER,
  ADMIN_NAME,
  SIGNATURE,
  isForSurfShark = false,
}) {
  return (
    <Document pageLayout="singlePage">
      <Page size="A4" style={styles.page}>
        <View style={{ marginHorizontal: 30 }}>
          <Image src="/logo.png" style={styles.image} />
          <Text style={styles.title}>FREELANCE CONTENT CREATOR AGREEMENT</Text>
          <Text
            style={{
              fontSize: 13,
              letterSpacing: -0.5,
              fontWeight: 800,
              marginTop: 20,
            }}
          >
            Private and Confidential
          </Text>
          <Text
            style={{
              fontSize: 13,
              textAlign: 'justify',
              marginTop: 20,
            }}
          >
            This Agreement is entered into this date{' '}
            <Text style={{ fontWeight: 800 }}>(“Effective Date”)</Text>{' '}
            <Text style={{ fontWeight: 800 }}>{DATE}</Text> between{' '}
            <Text style={{ fontWeight: 800 }}>Cult Creative Sdn Bhd 202001018157 (1374477-W)</Text>{' '}
            located at 5-3A, Block A, Jaya One, 72A Jalan Profesor Diraja Ungku Aziz, PJS 13, 46200
            Petaling Jaya Selangor <Text style={{ fontWeight: 800 }}>(“Cult Creative”)</Text> and{' '}
            <Text style={{ fontWeight: 800 }}>{FREELANCER_FULL_NAME} </Text>
            (NRIC/Passport No. :<Text style={{ fontWeight: 800 }}>{IC_NUMBER} </Text>)
          </Text>

          {isForSurfShark && (
            <View>
              <Text
                style={{
                  fontSize: 13,
                  textAlign: 'justify',
                  marginTop: 20,
                }}
              >
                For this campaign, the Parties are executing a separate{' '}
                <Link src="https://docs.google.com/document/d/1RmvZhgvX2oCSE4fD45Uto0X3PbOQtYOcjHF9b1sQCjY/edit?usp=sharing">
                  Campaign Addendum
                </Link>{' '}
                which supplements this Agreement. This Addendum is incorporated into and forms part
                of this Agreement for the specific campaign and in the event of any conflict between
                the Addendum and this Agreement, the Addendum shall prevail solely for this
                campaign. All other terms of this Agreement remain in full force and effect unless
                expressly modified by a campaign-specific addendum.
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  textAlign: 'justify',
                  marginTop: 20,
                }}
              >
                <Link src="https://surfshark.com/ambassadors-guide">“Campaign Creator Guide”</Link>{' '}
                means the Surfshark Creator Guide attached to this agreement and also linked{' '}
                <Link src="https://surfshark.com/ambassadors-guide">here</Link> which sets out
                campaign-specific content guidance, product information, messaging considerations
                and platform-specific best practices applicable solely to the Deliverables created
                under this Agreement.
              </Text>
            </View>
          )}

          <Text
            style={{
              fontSize: 13,
              textAlign: 'justify',
              marginTop: 10,
            }}
          >
            Cult Creative and the Freelancer may each be referred to in this Agreement as a “Party”
            and collectively as the “Parties”. It is hereby agreed between the parties as follows:
          </Text>

          <View style={styles.line} />

          {/* 1. Services */}
          <View style={{ ...styles.section, marginTop: 0 }}>
            <Text style={styles.titlee}>1. Services</Text>
            <Text
              style={{
                fontSize: 12,
              }}
            >
              The Freelancer agrees to provide Cult Creative the acceptable and approved services as
              listed below:
            </Text>
            <View style={styles.list}>
              <Text style={styles.item}>
                a) To report directly to the appointed Client Success Managers from Cult Creative;
              </Text>
              <Text style={styles.item}>
                b) To remain contactable and responsive via email and/or via phone throughout the
                duration of the entire campaign; and
              </Text>
              <Text style={styles.item}>
                c) To film, edit and draft out the pieces of content required and deliver it to Cult
                Creative for viewing and approval within 4 working days from the Effective Date
                which extends and includes the day of receiving the product and/or the day scheduled
                for attending the designated location. Any delay will require a valid, reasonable
                reason.
              </Text>
              {isForSurfShark && (
                <Text style={styles.item}>
                  d) In performing the Services and producing the Deliverables, the Freelancer shall
                  comply with the Campaign Creator Guide solely in connection with this campaign.
                  This Campaign Creator Guide provides creative guidance, product information and
                  recommended best practices for promoting Surfshark products and does not amend the
                  Freelancer’s payment, intellectual property or termination rights except as
                  expressly provided in this Agreement.
                </Text>
              )}
            </View>
          </View>

          {/* 2. Deliverables */}
          <View style={{ ...styles.section, marginTop: isForSurfShark ? 50 : 0 }}>
            <Text style={styles.titlee}>2. Deliverables</Text>
            <Text>
              The Freelancer agrees to provide Cult Creative the acceptable and approved
              deliverables as listed below:
            </Text>
            <View style={styles.list}>
              <Text style={styles.item}>
                a) The Freelancer agrees to provide Cult Creative the acceptable and approved
                deliverables as listed in `Campaign Deliverables` of the attached Campaign Brief,
                which must adhere to the stipulations and specifications provided therein; and
              </Text>
              <Text style={styles.item}>
                b) As proof of completion of the Deliverables, the Freelancer shall, through the
                Platform;
              </Text>
              <Text style={{ ...styles.item, marginLeft: 20 }}>
                i) upload the posting link(s) to the published Deliverables, and
              </Text>
              <Text style={{ ...styles.item, marginLeft: 20 }}>
                ii) ensure that the Deliverables are live and accessible on the agreed social media
                channels.
              </Text>
              <Text style={{ ...styles.item, marginLeft: 10 }}>
                Deliverable shall be deemed incomplete until such proof has been provided via the
                Platform.
              </Text>
              <Text style={styles.item}>
                c) The Freelancer shall perform such other duties and tasks, or changes to the
                Services and Deliverables, as may be agreed upon by the Parties.
              </Text>
              {isForSurfShark && (
                <Text style={styles.item}>
                  d) All Deliverables must comply with the Campaign Brief and the Campaign Creator
                  Guide to be deemed acceptable and approved.
                </Text>
              )}
            </View>
          </View>
        </View>
        <Text style={styles.version}>{VERSION_NUMBER}</Text>
      </Page>

      <Page size="A4" style={{ ...styles.page }}>
        <View style={{ marginHorizontal: 30 }}>
          <Image src="/logo.png" style={styles.image} />
          <View style={styles.section}>
            <View style={{ ...styles.section, marginTop: 0 }}>
              <Text style={styles.titlee}>2A. Removal of Deliverables</Text>
              <Text>
                In the event that any Deliverables is removed, deleted or made inaccessible on the
                agreed social media channels due to the Freelancer’s actions or omissions (including
                but not limited to voluntarily deleting the Deliverable or changing account settings
                to private, the Deliverable shall be deemed incomplete and Cult Creative reserves
                the right to withhold payment or require the Freelancer to repost the Deliverable at
                no additional cost.
              </Text>
            </View>
          </View>

          <View style={{ ...styles.section, marginTop: 0 }}>
            <View style={{ ...styles.section, marginTop: -10 }}>
              <Text style={styles.titlee}>3. Termination</Text>

              <Text style={styles.item}>
                <Text style={styles.titlee}>3.1</Text> Either party may terminate this agreement by
                providing the other party with a 2-week written notice{' '}
                <Text style={{ fontWeight: 'bold' }}>or payment in lieu:</Text>
              </Text>
              <Text style={{ ...styles.item, marginLeft: 20, marginTop: 0 }}>
                <Text style={styles.titlee}>i.</Text> payment in lieu is calculated based on the
                number of undelivered deliverables which shall be determined proportionally based on
                the total payment due, with each deliverable’s value being a fraction of the total
                payment due. The specific fraction will be determined by dividing the total contract
                value by the number of deliverables specified in the agreement.
              </Text>

              <Text style={{ ...styles.item, fontWeight: 'bold' }}>
                <Text style={styles.titlee}>3.2</Text> Non-Performance, No-Shows & Failure to
                Deliver
              </Text>

              <Text style={{ ...styles.item }}>
                In addition, the Freelancer acknowledges and agrees that;
              </Text>

              <Text style={{ ...styles.item }}>
                <Text style={styles.titlee}>3.2.1.</Text> If the Freelancer fails to attend or
                appear at a scheduled reservation, booking or event arranged for the purpose of
                fulfilling a Deliverable without providing at least a forty-eight (48) hours’ prior
                written notice and a reasonable justification, the Freelancer shall be liable for;
              </Text>

              <Text style={{ ...styles.item, marginLeft: 20 }}>
                a. Reimbursement of any non-refundable costs incurred by Cult Creative or its Client
                (including booking fees, deposits or event costs); and/or
              </Text>
              <Text style={{ ...styles.item, marginLeft: 20 }}>
                b. Compensation up to the total contract value, to the extent reasonably reflecting
                Cult Creative’s or the Client’s actual loss.
              </Text>

              <Text style={{ ...styles.item }}>
                <Text style={styles.titlee}>3.2.2.</Text> If the Freelancer receives products, goods
                or other consideration for the purpose of content creation but fails to deliver the
                agreed Deliverables within the specified timeline without reasonable cause, Cult
                Creative may;
              </Text>

              <Text style={{ ...styles.item, marginLeft: 20 }}>
                a. Withhold all remaining payments due to the Freelancer; and
              </Text>
              <Text style={{ ...styles.item, marginLeft: 20 }}>
                b. Recover the retail value of the product(s) from the Freelancer unless such
                product is returned in unused and saleable condition within seven (7) days.
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.version}>{VERSION_NUMBER}</Text>
      </Page>

      <Page size="A4" style={{ ...styles.page }}>
        <View style={{ marginHorizontal: 30 }}>
          <Image src="/logo.png" style={styles.image} />

          <View style={{ ...styles.section }}>
            <Text style={{ ...styles.item }}>
              <Text style={styles.titlee}>3.2.3.</Text> If the Freelancer becomes unresponsive after
              having confirmed acceptance of products, reservations or bookings, Cult Creative shall
              be entitled to;
            </Text>

            <Text style={{ ...styles.item, marginLeft: 20 }}>
              a. Termination of the Agreement immediately;
            </Text>
            <Text style={{ ...styles.item, marginLeft: 20 }}>
              b. Withhold all outstanding payments, and
            </Text>
            <Text style={{ ...styles.item, marginLeft: 20 }}>
              c. Seek compensation of up to fifty-percent (50%) of the total contract value,
              provided such amount reasonable reflects the costs and damages incurred.
            </Text>
          </View>

          <View style={{ ...styles.section, marginTop: 0 }}>
            <Text style={{ ...styles.item }}>
              <Text style={styles.titlee}>3.2.4.</Text> If the Freelancer is provided with any
              equipment, property or loaned items (including but not limited to cameras, props,
              devices or client-owned goods) for the purpose of performing the Deliverables and
              fails, neglects or refuses to return such items in good condition (fair wear and tear
              expected within seven (7) days of written demand, Cult Creative may;
            </Text>

            <Text style={{ ...styles.item, marginLeft: 20 }}>
              a. Withhold all payments due to the Freelancer;
            </Text>
            <Text style={{ ...styles.item, marginLeft: 20 }}>
              b. Recover from the Freelancer and the replacement or repair cost of the property;
            </Text>
            <Text style={{ ...styles.item, marginLeft: 20 }}>
              c. Treat such failure as grounds for immediate termination of this Agreement; and
            </Text>
            <Text style={{ ...styles.item, marginLeft: 20 }}>
              d. Require the Freelancer to indemnify and hold harmless Cult Creative against any
              claims, losses, damages or expenses (including replacement costs) incurred by Cult
              Creative or its Client as a result of the Freelancer’s failure to return such
              property.
            </Text>
          </View>
        </View>
        <Text style={styles.version}>{VERSION_NUMBER}</Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={{ marginHorizontal: 30 }}>
          <Image src="/logo.png" style={styles.image} />
          <View style={styles.section}>
            <Text style={styles.titlee}>4. Remuneration</Text>
            <Text>
              The Freelancer shall receive a payment of{' '}
              <Text style={styles.bold}>{creatorPayment}</Text> upon completion of the accepted and
              approved services & deliverables for the duration of this agreement.
            </Text>
            <Text style={{ marginTop: 10 }}>
              The Freelancer shall receive an invoice from Cult Creative and henceforth Cult
              Creative shall pay the invoice within twenty-eight (28) calendar days of the date on
              the invoice. If the 28th day falls on a weekend or public holiday, the payment shall
              be made on the next business day. The payment shall be paid via bank transfer as
              follows:
            </Text>
          </View>

          <View style={styles.paymentView}>
            <Text>Name On Account: </Text>
            <Text
              style={{
                fontWeight: 600,
              }}
            >
              {CREATOR_BANK_ACCOUNT_NAME || CREATOR_NAME}
            </Text>
          </View>
          <View style={styles.paymentView}>
            <Text>Account Number: </Text>
            <Text
              style={{
                fontWeight: 600,
              }}
            >
              {CREATOR_ACCOUNT_NUMBER}
            </Text>
          </View>
          <View style={styles.paymentView}>
            <Text>Bank Name: </Text>
            <Text
              style={{
                fontWeight: 600,
              }}
            >
              {CREATOR_BANK_NAME}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.titlee}>5. Duration</Text>
            <Text>
              This Agreement will begin on the Effective Date and will continue until{' '}
              <Text style={styles.bold}>{AGREEMENT_ENDDATE}, </Text> the Expected End Date. This
              agreement period is <Text style={styles.bold}>1 month </Text>If there are still
              pending project services or deliverables, the term will be extended by an extra week
              without any additional charges.
            </Text>
            <Text style={{ marginTop: 10, fontWeight: 700 }}>
              This Agreement is governed by the terms and conditions outlined herein. For more
              detailed information, please refer{' '}
              <Link src="https://docs.google.com/document/d/12xPs0Ql9UwHOIPnT0rf_Uo_7tabVKlso7JXM2Uw7B0U">
                here
              </Link>{' '}
              to the full set of terms and conditions. This Agreement constitutes the Parties entire
              understanding of their rights and obligations. The signature of the Parties indicate
              their acknowledgement and agreement of the Campaign Brief and Agreement as of the
              Effective Date.
            </Text>
          </View>

          {/* Signature */}
          <View style={styles.signatureView}>
            <View
              style={{
                display: 'flex',
                gap: SIGNATURE ? 15 : 100,
                fontSize: 12,
              }}
            >
              <View>
                <Text>Signature of</Text>
                {SIGNATURE && (
                  <Image
                    src={SIGNATURE}
                    style={{
                      width: 150,
                      marginTop: 10,
                    }}
                  />
                )}
              </View>

              <View>
                <View style={styles.signatureChild}>
                  <Text>Name: </Text>
                  <Text>{ADMIN_NAME}</Text>
                </View>
                <View style={styles.signatureChild}>
                  <Text>NRIC: </Text>
                  <Text>{ADMIN_IC_NUMBER}</Text>
                </View>
                <View style={styles.signatureChild}>
                  <Text>Date: </Text>
                  <Text>{dayjs().format('LL')}</Text>
                </View>
              </View>
            </View>
            <View
              style={{
                display: 'flex',
                gap: 100,
                fontSize: 12,
              }}
            >
              <Text>Signature of</Text>
              <View>
                <View style={styles.signatureChild}>
                  <Text>Name: </Text>
                  <Text>{FREELANCER_FULL_NAME}</Text>
                </View>
                <View style={styles.signatureChild}>
                  <Text>NRIC/ Passport No.:</Text>
                  <Text>{IC_NUMBER}</Text>
                </View>
                <View style={styles.signatureChild}>
                  <Text>Date: </Text>
                  <Text>{NOW_DATE}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.version}>{VERSION_NUMBER}</Text>
      </Page>
    </Document>
  );
}
