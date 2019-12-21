/**
 * @file RealTimeTransactions
 * @author zhouminghui
 */

import React, { PureComponent } from 'react';
import { Row, Col, Divider } from 'antd';
import dayjs from 'dayjs';
import moment from 'moment';
import { connect } from 'react-redux';

import { Link } from 'react-router-dom';
import {
  SYMBOL,
  ELF_DECIMAL,
  ELF_PRECISION,
  TXSSTATUS,
  REAL_TIME_FETCH_INTERVAL
} from '@src/constants';
import { thousandsCommaWithDecimal } from '@utils/formater';
import { get } from '../../../../../utils';
import { RESOURCE_REALTIME_RECORDS } from '../../../../../constants';
import './RealTimeTransactions.less';
// import lessVariables from '@src/assets/less/_variables.less';
// console.log({
//   lessVariables
// })

const fetchLimit = 20;
const displayLimit = 5;
class RealTimeTransactions extends PureComponent {
  constructor(props) {
    super(props);
    this.getResourceRealtimeRecordsTimer = null;
    this.state = {
      menuIndex: this.props.menuIndex,
      menuName: ['Ram', 'Cpu', 'Net', 'Sto'],
      recordsData: null
    };
  }

  componentDidMount() {
    this.getResourceRealtimeRecords();
  }

  static getDerivedStateFromProps(props, state) {
    if (props.menuIndex !== state.menuIndex) {
      return {
        menuIndex: props.menuIndex
      };
    }
    return null;
  }

  componentDidUpdate(prevProps) {
    if (prevProps.menuIndex !== this.props.menuIndex) {
      clearTimeout(this.getResourceRealtimeRecordsTimer);
      this.getResourceRealtimeRecords();
    }
  }

  getTableHeadHTML() {
    return (
      <Row className='table-head' type='flex' align='middle'>
        <Col span={6} offset={6}>
          Average price({SYMBOL})
        </Col>
        <Col span={6}>Number</Col>
        <Col span={6}>Cumulative</Col>
      </Row>
    );
  }

  async getResourceRealtimeRecords() {
    const { menuIndex, menuName } = this.state;
    const type = menuName[menuIndex];
    const data = await get(RESOURCE_REALTIME_RECORDS, {
      limit: fetchLimit,
      type
    });
    // todo: move the logic to backend
    // todo: repeating code
    data.buyRecords = data.buyRecords
      .filter(item => item.tx_status === TXSSTATUS.Mined)
      .sort((a, b) => moment(b.time).unix() - moment(a.time).unix())
      .slice(0, displayLimit)
      .map(item => {
        item.resource = +item.resource / ELF_DECIMAL;
        return item;
      });
    data.soldRecords = data.soldRecords
      .filter(item => item.tx_status === TXSSTATUS.Mined)
      .sort((a, b) => moment(b.time).unix() - moment(a.time).unix())
      .slice(0, displayLimit)
      .map(item => {
        item.resource = +item.resource / ELF_DECIMAL;
        return item;
      });
    // console.log('data', data);
    this.setState({
      recordsData: data || []
    });
    this.props.getRealTimeTransactionLoading();
    this.getResourceRealtimeRecordsTimer = setTimeout(() => {
      this.getResourceRealtimeRecords();
    }, REAL_TIME_FETCH_INTERVAL);
  }

  componentWillUnmount() {
    clearTimeout(this.getResourceRealtimeRecordsTimer);
  }

  getSellInfoHTML() {
    const { recordsData } = this.state;
    let data = null;
    if (recordsData) {
      data = recordsData.soldRecords || [];
      const recordsDataHtml = data.map((item, index) => {
        const date = this.formatDate(item.time);
        // const fee = Math.ceil(item.fee / 1000);
        const { resource } = item;
        let { elf, fee } = item;
        elf /= ELF_DECIMAL;
        fee /= ELF_DECIMAL;
        return (
          <Row className='table-sell' type='flex' align='middle' key={index}>
            <Col span={4}>
              <Link to={`/tx/${item.tx_id}`}>{date}</Link>
            </Col>
            <Col span={3} className='sell'>
              Sell
            </Col>
            <Col span={5}>
              {((elf - fee) / resource).toFixed(ELF_PRECISION)}
            </Col>
            <Col span={6}>{thousandsCommaWithDecimal(resource)}</Col>
            <Col span={6}>{thousandsCommaWithDecimal(elf - fee)}</Col>
          </Row>
        );
      });
      return recordsDataHtml;
    }
  }

  // todo: Move to utils or redesign the mobile view
  formatDate(date) {
    const { isSmallScreen } = this.props;

    const format = isSmallScreen ? 'HH:mm:ss' : 'HH:mm:ss.SSS';
    return moment(date).format(format);
  }

  // todo: decrease the repeating code
  getBuyInfoHTML() {
    const { recordsData } = this.state;

    let data = null;
    if (recordsData) {
      data = recordsData.buyRecords || [];
      // console.log('data', data);
      const recordsDataHtml = data.map((item, index) => {
        const date = this.formatDate(item.time);
        let { elf, fee } = item;
        elf /= ELF_DECIMAL;
        fee /= ELF_DECIMAL;
        // const fee = Math.ceil(item.fee / 1000);
        // const fee = item.fee / 1000;
        // console.log('fee', fee);
        return (
          <Row className='table-buy' type='flex' align='middle' key={index}>
            <Col span={4}>
              <Link to={`/tx/${item.tx_id}`}>{date}</Link>
            </Col>
            <Col span={3} className='sell'>
              Buy
            </Col>
            <Col span={5}>
              {((elf + fee) / item.resource).toFixed(ELF_PRECISION)}
            </Col>
            <Col span={6}>{thousandsCommaWithDecimal(item.resource)}</Col>
            <Col span={6}>{thousandsCommaWithDecimal(elf + fee)}</Col>
          </Row>
        );
      });
      return recordsDataHtml;
    }
  }

  render() {
    const tableHead = this.getTableHeadHTML();
    const sellInfo = this.getSellInfoHTML();
    const buyInfo = this.getBuyInfoHTML();
    return (
      <div className='real-time-transactions'>
        <Row>
            <Col className="real-time-transactions-head">Real Time Transactions</Col>
        </Row>
        <Divider className="resource-buy-divider" />
        <div className='real-time-transactions-body'>
          {tableHead}
          {sellInfo}
          {buyInfo}
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  ...state.common
});

export default connect(mapStateToProps)(RealTimeTransactions);
