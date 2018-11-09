import React, { Component } from "react";
import { Link } from "react-router-dom";
import { observer, inject } from "mobx-react";
import {
    Row,
    Col,
    Icon,
    List,
    message
} from "antd";

// object, array, string, or  jQuery - like
import isEmpty from "lodash/isEmpty";
import InfoList from "../../components/InfoList/InfoList";
import TradeCards from "../../components/TradeCards/TradeCards";
// import TradeChart from "../../components/TradeChart";
import { get, format, aelf } from "../../utils";
import {
    TXSSTATUS,
    PAGE_SIZE,
    ALL_BLOCKS_API_URL,
    ALL_TXS_API_URL
} from "../../constants";

import "./home.styles.less";

const fetchInfoByChainIntervalTime = 4000;

@inject("appIncrStore")
@observer
export default class HomePage extends Component {

    state = {
        blocks: [],
        transactions: []
    };

    blockHeight = 0;

    componentDidCatch(error) {
        console.error(error);
        // TODO 弹窗提示
        clearInterval(this.interval);
    }
 
    componentWillUnmount() {
        clearInterval(this.interval);
        this.setState = () => {};
    }

    async componentDidMount() {
        // it's making two xhr to get realtime block_height and transaction data.
        // it's simplest that it do not need block_scan_api to get full chain data.
        // but it need a some sugar.
        const { blocks } = await this.fetch(ALL_BLOCKS_API_URL);
        const { transactions } = await this.fetch(ALL_TXS_API_URL);

        this.setState({
            blocks,
            transactions
        });

        this.interval = setInterval(() => {
            this.fetchInfoByChain();
        }, fetchInfoByChainIntervalTime);
    }

    async fetch(url) {
        const res = await get(url, {
            page: 0,
            limit: PAGE_SIZE,
            order: "desc"
        });

        return res;
    }

    // get increament block data
    // 1. Get the lastest 100 Blocks Info from databases at first.
    // 2. Get the new Blocks Info from Aelf Chain.
    // 3. If the (block_height in Chain) - (block_height in Databases) > 10, 
    //    Notice the users we have problem, and get New Block from Aelf Chain.
    // 4. In the page, if block.length > 100, .length =100 ,then, unshift.
    fetchInfoByChain() {
        // const store = this.props.appIncrStore;

        let newBlocksList = this.state.blocks.concat([]);
        let newTxsList = this.state.transactions.concat([]);

        const LISTLIMIT = PAGE_SIZE;

        if (this.blockHeight) {
            this.blockHeight++;
        } else {
            try {
                const {
                    result: {
                        block_height
                    }
                } = aelf.chain.getBlockHeight();
                this.blockHeight = block_height;
            } catch (e) {
                message.error(e.message, 2);
            }
        }
        
        const {
            result: { Blockhash = '', Body = '', Header = '' } = {}
        } = aelf.chain.getBlockInfo(this.blockHeight, 100);

        if (isEmpty('' + this.blockHeight)) {
            message.error('Can not get Block Info from Aelf Node!!!.', 6);
        }
        if (isEmpty(Blockhash)) {
            this.blockHeight--;
            // console.log(this.blockHeight, Blockhash);
            return;
        }

        const chainBlocks = {
            block_hash: Blockhash,
            block_height: +this.blockHeight,
            chain_id: Header.ChainId,
            merkle_root_state: Header.MerkleTreeRootOfWorldState,
            merkle_root_tx: Header.MerkleTreeRootOfTransactions,
            pre_block_hash: Header.PreviousBlockHash,
            time: Header.Time,
            tx_count: Body.TransactionsCount
        };
        
        let pre_block_height = newBlocksList[0].block_height;
        if (this.blockHeight - pre_block_height > 10) {
            message.warning('Notice: Blocks in Databases is behind more than 10 blocks in the Chain.', 6);
        }
        if (newBlocksList.length > LISTLIMIT) {
            newBlocksList.length = LISTLIMIT;
        }
        newBlocksList.unshift(chainBlocks);

        if (!isEmpty(Body.Transactions)) {
            Body.Transactions.forEach(txId => {
                const { result } = aelf.chain.getTxResult(txId);

                let newTxs = {
                    address_from: result.tx_info.From,
                    address_to: result.tx_info.To,
                    block_hash: result.block_hash,
                    block_height: result.block_number,
                    increment_id: result.tx_info.IncrementId,
                    method: result.tx_info.Method,
                    params: result.tx_info.params,
                    tx_id: result.tx_info.TxId,
                    tx_status: result.tx_status
                };

                if (newTxsList.length > LISTLIMIT) {
                    newTxsList.length = LISTLIMIT;
                }

                newTxsList.unshift(newTxs);

            });
        }

        // console.log(newBlocksList.length, newTxsList.length);
        this.setState({
            blocks: newBlocksList,
            transactions: newTxsList,
        });
    }

    blockRenderItem = item => {
        const blockHeight = item.block_height;
        const title = (
            <span>
                Block: <Link to={`/block/${blockHeight}`}>{blockHeight}</Link>
            </span>
        );
        const desc = (
            <span className="infoList-desc">
                Number of transactions:
                <Link to={`/txs/block?${item.block_hash}`}>{item.tx_count}</Link>
            </span>
        );
        return (
            <List.Item key={blockHeight}>
                <List.Item.Meta title={title} description={desc} />
                <div>{format(item.time)}</div>
            </List.Item>
        );
    };

    txsRenderItem = item => {
        const blockHeight = item.block_height;

        let tx_id = item.tx_id;
        let txIDlength = tx_id.length;
        let txIDShow = tx_id.slice(0, 10) + '...' + tx_id.slice(txIDlength - 10, txIDlength);

        const title = (
            <span>
                Transaction:
                < Link to = {
                    `/tx/${tx_id}`
                } >
                    {
                        txIDShow
                    }
                </Link>
            </span>
        );
        const desc = (
            <span className="infoList-desc">
                From:
                <Link to={`/address/${item.address_from}`}>
                    {item.address_from.slice(0, 6)}
                    ...
                </Link>
                To:
                <Link to={`/address/${item.address_to}`}>
                    {item.address_to.slice(0, 6)}
                    ...
                </Link>
            </span>
        );
        return (
            <List.Item key={blockHeight}>
                <List.Item.Meta title={title} description={desc} />
                <div>Trading Status: {TXSSTATUS[item.tx_status]}</div>
            </List.Item>
        );
    };

    render() {
        const { blocks, transactions } = this.state;
        return [
            <Row
                type="flex"
                justify="space-between"
                align="middle"
                className="content-container"
                key="tradeinfo"
                gutter={16}
            >
                <Col span="12">
                    <TradeCards key="tradecards" />
                </Col>
                {/* <Col span="12">
                    <TradeChart key="tradechart" />
                </Col> */}
            </Row>,
            <Row
                type="flex"
                justify="space-between"
                align="middle"
                className="content-container"
                key="infolist"
                gutter={16}
            >
                <Col span="12" className="container-list">
                    <div className="panel-heading">
                        <h2 className="panel-title">
                            <Icon type="gold" className="anticon" />
                            Blocks
                        </h2>
                        <Link to="/blocks" className="pannel-btn">
                            View all
                        </Link>
                    </div>
                    <InfoList
                        title="Blocks"
                        iconType="gold"
                        dataSource={blocks}
                        renderItem={this.blockRenderItem}
                    />
                </Col>
                <Col span="12" className="container-list">
                    <div className="panel-heading">
                        <h2 className="panel-title">
                            <Icon type="gold" className="anticon" />
                            Transactions
                        </h2>
                        <Link to="/txs" className="pannel-btn">
                            View all
                        </Link>
                    </div>
                    <InfoList
                        title="Transaction"
                        iconType="pay-circle"
                        dataSource={transactions}
                        renderItem={this.txsRenderItem}
                    />
                </Col>
            </Row>
        ];
    }
}