import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Page, View, Text, Font, Image, Document, StyleSheet } from '@react-pdf/renderer';

import { fDate } from 'src/utils/format-time';

// ----------------------------------------------------------------------

Font.register({
  family: 'Roboto',
  fonts: [{ src: '/fonts/Roboto-Regular.ttf' }, { src: '/fonts/Roboto-Bold.ttf' }],
});

const useStyles = () =>
  useMemo(
    () =>
      StyleSheet.create({
        col4: { width: '25%' },
        col8: { width: '75%' },
        col6: { width: '50%' },
        mb4: { marginBottom: 4 },
        mb8: { marginBottom: 8 },
        mb40: { marginBottom: 40 },
        h3: { fontSize: 16, fontWeight: 700 },
        h4: { fontSize: 13, fontWeight: 700 },
        body1: { fontSize: 10 },
        body2: { fontSize: 9 },
        subtitle1: { fontSize: 10, fontWeight: 700 },
        subtitle2: { fontSize: 9, fontWeight: 700 },
        alignRight: { textAlign: 'right' },
        page: {
          fontSize: 9,
          lineHeight: 1.6,
          fontFamily: 'Roboto',
          backgroundColor: '#FFFFFF',
          textTransform: 'capitalize',
          padding: '40px 24px 120px 24px',
        },
        footer: {
          left: 0,
          right: 0,
          bottom: 0,
          padding: 24,
          margin: 'auto',
          borderTopWidth: 1,
          borderStyle: 'solid',
          position: 'absolute',
          borderColor: '#DFE3E8',
        },
        gridContainer: {
          flexDirection: 'row',
          justifyContent: 'space-between',
        },
        table: {
          display: 'flex',
          width: 'auto',
        },
        tableRow: {
          padding: '8px 0',
          flexDirection: 'row',
          borderBottomWidth: 1,
          borderStyle: 'solid',
          borderColor: '#DFE3E8',
        },
        noBorder: {
          paddingTop: 8,
          paddingBottom: 0,
          borderBottomWidth: 0,
        },
        tableCell_1: {
          width: '5%',
        },
        tableCell_2: {
          width: '50%',
          paddingRight: 16,
        },
        tableCell_3: {
          width: '15%',
        },
      }),
    []
  );

// ----------------------------------------------------------------------

export default function InvoicePDF({ invoice, currentStatus }) {
  const styles = useStyles();

  const bankInfo = () => (
    <View style={[styles.table, styles.mb40]}>
      <View>
        <View style={styles.tableRow}>
          <View style={styles.tableCell_1}>
            <Text style={styles.subtitle2}>#</Text>
          </View>

          <View style={styles.tableCell_2}>
            <Text style={styles.subtitle2}>Recipent Name</Text>
          </View>

          <View style={[styles.tableCell_2]}>
            <Text style={styles.subtitle2}>Bank Name</Text>
          </View>

          <View style={styles.tableCell_2}>
            <Text style={styles.subtitle2}>Account Number</Text>
          </View>

          <View style={styles.tableCell_2}>
            <Text style={styles.subtitle2}>Recipent Email</Text>
          </View>
        </View>
      </View>

      <View>
        <View style={styles.tableRow} key={invoice?.id}>
          <View style={styles.tableCell_1}>
            <Text>{1}</Text>
          </View>

          <View style={styles.tableCell_2}>
            <Text style={styles.subtitle2}>{invoice?.bankAcc.payTo}</Text>
          </View>

          <View style={[styles.tableCell_2]}>
            <Text>{invoice?.bankAcc.bankName}</Text>
          </View>
          <View style={[styles.tableCell_2]}>
            <Text>{invoice?.bankAcc.accountNumber}</Text>
          </View>
          <View style={[styles.tableCell_2]}>
            <Text>{invoice?.bankAcc.accountEmail}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={[styles.gridContainer, styles.mb40]}>
          <Image source="/logo/cult_logo.png" style={{ width: 100, height: 48 }} />

          <View style={{ alignItems: 'flex-end', flexDirection: 'column' }}>
            <Text style={styles.h3}>{currentStatus || invoice?.status}</Text>
            <Text style={styles.h2}> {invoice?.invoiceNumber} </Text>
          </View>
        </View>

        <View style={[styles.gridContainer, styles.mb40]}>
          <View style={styles.col6}>
            <Text style={[styles.subtitle2, styles.mb4]}>Invoice from</Text>
            <Text style={styles.body2}>{invoice?.invoiceFrom?.name}</Text>
            <Text style={styles.body2}>{invoice?.invoiceFrom?.fullAddress}</Text>
            <Text style={styles.body2}>{invoice?.invoiceFrom?.phoneNumber}</Text>
          </View>

          <View style={styles.col6}>
            <Text style={[styles.subtitle2, styles.mb4]}>Invoice to</Text>
            <Text style={styles.body2}>{invoice?.invoiceTo?.name}</Text>
            <Text style={styles.body2}>{invoice?.invoiceTo?.fullAddress}</Text>
            <Text style={styles.body2}>{invoice?.invoiceTo?.phoneNumber}</Text>
          </View>
        </View>

        <View style={[styles.gridContainer, styles.mb40]}>
          <View style={styles.col6}>
            <Text style={[styles.subtitle2, styles.mb4]}>Invoice Date</Text>
            <Text style={styles.body2}>{fDate(invoice?.createdAt)}</Text>
          </View>
          <View style={styles.col6}>
            <Text style={[styles.subtitle2, styles.mb4]}>Due date</Text>
            <Text style={styles.body2}>{fDate(invoice?.dueDate)}</Text>
          </View>
        </View>

        <Text style={[styles.subtitle1, styles.mb8]}>Bank Information</Text>
        {bankInfo()}
        <Text style={[styles.subtitle1, styles.mb8]}>Invoice Details</Text>
        <View style={styles.table}>
          <View>
            <View style={styles.tableRow}>
              <View style={styles.tableCell_1}>
                <Text style={styles.subtitle2}>#</Text>
              </View>

              <View style={styles.tableCell_2}>
                <Text style={styles.subtitle2}>Client Name</Text>
              </View>
              <View style={styles.tableCell_2}>
                <Text style={styles.subtitle2}>Campaign Name</Text>
              </View>

              <View style={[styles.tableCell_2]}>
                <Text style={styles.subtitle2}>Total</Text>
              </View>
            </View>
          </View>

          <View>
            <View style={styles.tableRow} key={invoice?.id}>
              <View style={styles.tableCell_1}>
                <Text>{1}</Text>
              </View>

              <View style={[styles.tableCell_2]}>
                <Text>{invoice?.campaign.company?.name || invoice?.campaign.brand?.name}</Text>
              </View>
              <View style={styles.tableCell_2}>
                <Text>{invoice?.campaign?.name}</Text>
              </View>

              <View style={[styles.tableCell_2]}>
                <Text>{`${invoice.campaign.creatorAgreement[0].currency} ${invoice?.amount}`}</Text>
              </View>
            </View>

            <View style={[styles.tableRow, styles.noBorder]}>
              <View style={styles.tableCell_1} />
              <View style={styles.tableCell_2} />
              <View style={styles.tableCell_3} />
              <View style={styles.tableCell_3}>
                <Text style={styles.h4}>Total</Text>
              </View>
              <View style={[styles.tableCell_3, styles.alignRight]}>
                <Text style={styles.h4}>{`${invoice.campaign.creatorAgreement[0].currency} ${invoice?.amount}`}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.gridContainer, styles.footer]} fixed>
          <View style={styles.col8}>
            <Text style={styles.subtitle2}>NOTES</Text>
            <Text>
              We appreciate your business. Should you need us to add VAT or extra notes let us know!
            </Text>
          </View>
          <View style={[styles.col4, styles.alignRight]}>
            <Text style={styles.subtitle2}>Have a Question?</Text>
            <Text>hello@cultcreative.asia</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

InvoicePDF.propTypes = {
  currentStatus: PropTypes.string,
  invoice: PropTypes.object,
};
