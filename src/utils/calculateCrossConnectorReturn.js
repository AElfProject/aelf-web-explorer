/**
 * @file calculateCrossConnectorReturn
 * @author zhouminghui
 * Computing Equivalent Value
*/

import {Decimal} from 'decimal.js';

// bt: balanceTo bf: balanceFrom wt: weightTo wt: weightFrom a: buy/sell balance
// Calculate the valuation according to the calculating formula

export default function scalculateCrossConnectorReturn(ResBalance, ResWeight, ElfBalance, ElfWeight, pidRes) {
    console.log('bf:', ResBalance, 'wf:', ResWeight, 'bt', ElfBalance, 'wt:', ElfWeight, 'a:', pidRes);
    const bt = ResBalance;
    const wt = ResWeight;
    const bf = ElfBalance;
    const wf = ElfWeight;
    const a = pidRes;
    if (wf.toNumber() === wt.toNumber()) {
        // if both weights are the same, the formula can be reduced
        return (bf.times(a).div(bt.minus(a))).toNumber();
    }

    // For non-integer or very large exponents pow(x, y) is calculated using
    // x^y = exp(y*ln(x))
    const x = bt.div(bt.minus(a));
    const y = wt.div(wf);
    return Decimal.exp(y * Decimal.ln(x)).minus(1).times(bf).toNumber();

    // console.log(Math.pow(x, y) - 1);
    // return (Math.pow(x, y) - 1) * bf;
}
