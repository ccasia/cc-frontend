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
            located at Lot 4-401 & 4-402, Level 4, The Starling Mall, Jalan SS21/37, Damansara
            Utama, 47400 Petaling Jaya, Selangor Darul Ehsan, Malaysia{' '}
            <Text style={{ fontWeight: 800 }}>(“Cult Creative”)</Text> and{' '}
            <Text style={{ fontWeight: 800 }}>{FREELANCER_FULL_NAME} </Text>
            (NRIC/Passport No. :<Text style={{ fontWeight: 800 }}>{IC_NUMBER} </Text>) located at{' '}
            <Text style={{ fontWeight: 800 }}>{ADDRESS} (“Freelancer”). </Text>
            Cult Creative and the Freelancer may each be referred to in this Agreement as a “Party”
            and collectively as the “Parties”. It is hereby agreed between the parties as follows:
          </Text>
          <View style={styles.line} />

          {/* 1. Services */}
          <View style={styles.section}>
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
                b) To remain contactable and responsive via email at{' '}
                <Text style={styles.bold}>{ccEmail}</Text> and/or via phone at{' '}
                <Text style={styles.bold}>{ccPhoneNumber}</Text> throughout the duration of the
                entire campaign; and
              </Text>
              <Text style={styles.item}>
                c) To film, edit, and draft out the pieces of content required and deliver it to
                Cult Creative for viewing and approval within 4 working days from the Effective Date
                (<Text style={styles.bold}>{effectiveDate}</Text>), which extends and includes the
                day of receiving the product and/or the day scheduled for attending the designated
                location. Any delay will require a valid, reasonable reason.
              </Text>
            </View>
          </View>

          {/* 2. Deliverables */}
          <View style={styles.section}>
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
                b) The Freelancer shall perform such other duties and tasks, or changes to the
                Services and Deliverables, as may be agreed upon by the Parties.
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.version}>{VERSION_NUMBER}</Text>
      </Page>
      <Page size="A4" style={styles.page}>
        <View style={{ marginHorizontal: 30 }}>
          <Image src="/logo.png" style={styles.image} />
          <View style={styles.section}>
            <Text style={styles.titlee}>3. Remuneration</Text>
            <Text>
              The Freelancer shall receive a payment of RM
              <Text style={styles.bold}>{creatorPayment}</Text> upon completion of the accepted and
              approved services & deliverables for the duration of this agreement.
            </Text>
            <Text style={{ marginTop: 10 }}>
              The Freelancer shall receive an invoice from Cult Creative within fourteen (14)
              calendar days of completion of the work done. Cult Creative shall pay the invoice
              within fourteen (14) calendar days of the date on the invoice. The payment shall be
              paid at the end of the calendar month via bank transfer as follows:
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
            <Text style={styles.titlee}>4. Duration</Text>
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
              <Link src="https://docs.google.com/document/d/12xPs0Ql9UwHOIPnT0rf_Uo_7tabVKlso7JXM2Uw7B0U/edit">
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
