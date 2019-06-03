import React from 'react';
import ReactDOM from 'react-dom';
import './app.css';

import { parseCSV } from './csv';

const FieldType = {
    TEXT: 'text',
    NUMBER: 'number',
    DATE: 'date',
    CURRENCY: 'currency'
}

const fieldValue = (value, fieldType, editing) => {
    if (fieldType == FieldType.CURRENCY)
    {
        var floatValue = parseFloat(value.toString().replace(/,/g, ''));
        if (isNaN(floatValue))
        {
            return { value: 0, success : true };
        }
        return { value: floatValue, success : true };
    }
    if (fieldType == FieldType.NUMBER)
    {
        var intValue = parseInt(value.toString().replace(/,/g, ''));
        if (isNaN(intValue))
        {
            return { value: 0, success : true };
        }
        return { value: intValue, success : true };
    }
    return { value: value, success : true };
}

const formattedFieldValue = (value, fieldType, editing) => {
    
    if (fieldType == FieldType.CURRENCY || fieldType == FieldType.NUMBER)
    {
        var { value, success } = fieldValue(value, fieldType, editing);
        if (!success)
        {
            return 0;
        }

        if (fieldType == FieldType.CURRENCY)
        {
            value = Math.round((value + 0.00001) * 100) / 100;
            if (!editing)
            {
                return value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            return value.toFixed(2);
        }
        if (fieldType == FieldType.NUMBER)
        {
            if (!editing)
            {
                return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
            }
            return value.toFixed(0);
        }
    }
    if (fieldType == FieldType.DATE)
    {
        if (editing)
        {
            var month = '' + (value.getMonth() + 1);
            var day = '' + value.getDate();
            var year = value.getFullYear();
    
            return [month, day, year].join('/');
        }
        else
        {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };

            return value.toLocaleDateString("en-US", options);
        }
    }
    return value;
}

class StaticField extends React.Component {
    render() {
        const { fieldType } = this.props;
        const value = formattedFieldValue(this.props.value, this.props.fieldType);

        const rows = [];

        if (fieldType == FieldType.CURRENCY)
        {
            rows.push(<span key="currency_prefix">$</span>);
        }

        rows.push(<span key="field_value">{value}</span>);

        return (
            <span>{rows}</span>
        );
    }
}

class InteractiveField extends StaticField {
    constructor(props) {
        super(props);

        this.state = {
            focused : false,
            value : formattedFieldValue(props.value, props.fieldType)
        }

        this.input = React.createRef();
        this.handleInputChange = this.handleInputChange.bind(this);
        this.handleFocus = this.handleFocus.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
    }

    componentDidMount() {
        this.updateInputWidth();
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        this.updateInputWidth();
    }

    handleInputChange(e) {
        this.setState({
            value : e.target.value
        });

        if (this.props.onChange)
        {
            this.props.onChange(e.target.value);
        }
    }

    handleFocus(e) {
        this.setState({
            focused: true,
            value: formattedFieldValue(this.props.value, this.props.fieldType, true)
        });
    }

    handleBlur(e) {
        this.setState({
            focused: false
        });

        if (this.props.onChange)
        {
            this.props.onChange(formattedFieldValue(this.props.value, this.props.fieldType));
        }
    }

    currentValue() {
        if (this.state.focused)
        {
            return this.state.value;
        }
        return formattedFieldValue(this.props.value, this.props.fieldType);
    }

    updateInputWidth() {
        const input = this.input.current;

        const value = this.currentValue().toString();
        const width = (value.length == 0) ? 1 : value.length;

        input.style.width = (width + 0.1) + "ch";
    }

    render() {
        const { fieldType } = this.props;
        const value = this.currentValue();

        const rows = [];

        if (fieldType == FieldType.CURRENCY)
        {
            rows.push(<span key="currency_prefix">$</span>);
        }

        rows.push(
            <input key="field_value"
                   ref={this.input}
                   type="text"
                   onChange={this.handleInputChange}
                   spellCheck="false"
                   value={value}
                   onFocus={this.handleFocus}
                   onBlur={this.handleBlur}>
            </input>
        );

        return rows;
    }
}

const Field = {
    TICKER : 'ticker',
    QUANTITY : 'quantity',
    PRICE : 'price'
}

class Buy extends React.Component {

    constructor(props) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
    }

    handleChange(field, value) {
        if (field == Field.TICKER)
        {
            if (this.props.onChange)
            {
                this.props.onChange({
                    ticker: value
                });
            }
        }
        else
        {
            var quantity = (field == Field.QUANTITY) ? value : this.props.buy.quantity;
            var price = (field == Field.PRICE) ? value : this.props.buy.price;

            var { value: floatQuantity, success: validQuantity } = fieldValue(quantity, FieldType.CURRENCY);
            var { value: floatPrice, success: validPrice } = fieldValue(price, FieldType.CURRENCY);

            if (this.props.onChange)
            {
                this.props.onChange({
                    quantity: floatQuantity,
                    price: floatPrice
                });
            }
        }
    }

    handleDelete() {
        if (this.props.onDelete)
        {
            this.props.onDelete();
        }
    }

    render() {
        const { ticker, quantity, price } = this.props.buy;
        const { handleChange } = this;

        var { value: floatQuantity, success: validQuantity } = fieldValue(quantity, FieldType.CURRENCY);
        var { value: floatPrice, success: validPrice } = fieldValue(price, FieldType.CURRENCY);

        var total = "";

        if (validQuantity && validPrice)
        {
            total = floatQuantity * floatPrice;
        }

        return (
            <div className="buy line">
                <InteractiveField value={ticker} onChange={value => {
                    handleChange(Field.TICKER, value);
                }} />
                &nbsp;⨯&nbsp;
                <InteractiveField value={quantity} fieldType={FieldType.NUMBER} onChange={value => {
                    handleChange(Field.QUANTITY, value);
                }} onBlur={value => {
                    handleChange(Field.QUANTITY, value);
                }} />
                &nbsp;@&nbsp;
                <InteractiveField value={price} fieldType={FieldType.CURRENCY} onChange={value => {
                    handleChange(Field.PRICE, value);
                }} onBlur={value => {
                    handleChange(Field.PRICE, value);
                }} />
                &nbsp;=&nbsp;
                <StaticField value={total} fieldType={FieldType.CURRENCY} />
                <a className="right" href="#" onClick={e => {
                    this.handleDelete();
                    e.preventDefault();
                }}>[x]</a>
            </div>
        )
    }
}

class Order extends React.Component {

    constructor(props) {
        super(props);

        this.handleDelete = this.handleDelete.bind(this);
        this.handleCreateBuy = this.handleCreateBuy.bind(this);
        this.handleDeleteBuy = this.handleDeleteBuy.bind(this);
        this.handleBuyChange = this.handleBuyChange.bind(this);
    }

    handleDelete() {
        if (this.props.onDelete)
        {
            this.props.onDelete();
        }
    }

    handleCreateBuy() {
        if (this.props.onCreateBuy)
        {
            this.props.onCreateBuy(this.props.order.id);
        }
    }

    handleDeleteBuy(id) {
        if (this.props.onDeleteBuy)
        {
            this.props.onDeleteBuy(this.props.order.id, id);
        }
    }

    handleBuyChange(id, update) {
        if (this.props.onBuyChange)
        {
            this.props.onBuyChange(this.props.order.id, id, update);
        }
    }

    render() {
        const order = this.props.order;

        const order_rows = [];
        var order_total = 0;

        order.buys.forEach((buy) => {
            order_total += buy.quantity * buy.price;
            order_rows.push(
                <Buy key={"order_" + order.id + "_buy_" + buy.id} buy={buy}
                     onChange={update => {
                         this.handleBuyChange(buy.id, update);
                     }}
                     onDelete={() => {
                         this.handleDeleteBuy(buy.id);
                     }}
                />
            );
        });

        return (
            <div className="order">
                <a className="right" href="#" onClick={e => {
                    this.handleDelete();
                    e.preventDefault();
                }}>[x]</a>
                <h2 key={"order_" + order.id + "title"}>
                    <StaticField key={"order_" + order.id + "title_value"}
                                 value={order.date}
                                 fieldType={FieldType.DATE} /> <a href="#" onClick={e => {
                        this.handleCreateBuy();
                        e.preventDefault();
                    }}>[+]</a>
                </h2>
                <div key={"order_" + order.id + "buys"} className="line">
                    {order_rows}
                </div>
                <b key={"order_" + order.id + "total"}>total</b>: <StaticField value={order_total} fieldType={FieldType.CURRENCY} />
            </div>
        );
    }
}

class Portfolio extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            orders: props.data.orders,
            next_order_id : props.data.orders.length
        };

        this.handleFileSelect = this.handleFileSelect.bind(this);
        this.handleFileLoad = this.handleFileLoad.bind(this);
        this.handleCreateOrder = this.handleCreateOrder.bind(this);
        this.handleDeleteOrder = this.handleDeleteOrder.bind(this);
        this.handleCreateBuy = this.handleCreateBuy.bind(this);
        this.handleDeleteBuy = this.handleDeleteBuy.bind(this);
        this.handleChangeBuy = this.handleChangeBuy.bind(this);
    }

    handleFileSelect(e) {
        const files = e.target.files;

        if (files.length > 0)
        {
            const file = files[0];

            var reader = new FileReader();
            reader.onload = this.handleFileLoad;
            reader.readAsText(file);
        }

        e.target.value = "";
    }

    handleFileLoad(e) {
        const text = e.target.result;
        const data = parseCSV(text);

        var loaded_orders = [];

        var next_order_id = 0
        var previous_order = null;
        var previous_date = "";

        data.forEach(entry => {
            if (entry.Date != previous_date)
            {
                if (previous_order != null)
                {
                    loaded_orders.push(previous_order);
                }
                previous_order = {
                    id : next_order_id++,
                    date : new Date(Date.parse(entry.Date)),
                    buys : [],
                    next_buy_id : 0
                };
                previous_date = entry.Date;
            }
            previous_order.buys.push({
                id: previous_order.next_buy_id++,
                ticker : entry.Symbol,
                quantity: parseInt(entry.Quantity),
                price: parseFloat(entry.Price)
            });
        });
        if (previous_order != null)
        {
            loaded_orders.push(previous_order);
        }

        loaded_orders = loaded_orders.sort((a, b) => {
            return b.date - a.date;
        });

        this.setState({
            orders: loaded_orders,
            next_order_id : next_order_id
        });
    }

    downloadPortfolio() {
        var text = "Date,Quantity,Symbol,Price,Currency\n"

        this.state.orders.forEach(order => {
            var stringDate = formattedFieldValue(order.date, FieldType.DATE, true);
            order.buys.forEach(buy => {
                text += stringDate;
                text += ',';
                text += formattedFieldValue(buy.quantity, FieldType.NUMBER, true);
                text += ',';
                text += formattedFieldValue(buy.ticker, FieldType.TEXT, true);
                text += ',';
                text += formattedFieldValue(buy.price, FieldType.CURRENCY, true);
                text += ',USD';
                text += '\n';
            });
        });

        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', "portfolio.json");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    handleCreateOrder() {
        var order = {
            id : this.state.next_order_id,
            date : new Date(),
            buys : [
                {
                    id: 1,
                    ticker : "",
                    quantity: 0,
                    price: 0
                }
            ],
            next_buy_id : 2
        }
        var updated_orders = this.state.orders;
        updated_orders.unshift(order);

        this.setState({
            orders: updated_orders,
            next_order_id : order.id + 1
        });
    }

    handleDeleteOrder(order_id) {
        var updated_orders = this.state.orders.filter((order) => {
            return order.id != order_id
        });

        this.setState({
            orders: updated_orders
        });
    }

    handleCreateBuy(order_id) {
        var updated_orders = this.state.orders;
        var order = updated_orders.find(order => {
            return order.id == order_id;
        });
        if (order)
        {
            order.buys.push({
                id: order.next_buy_id++,
                ticker : "",
                quantity: 0,
                price: 0
            });
        }
        this.setState({
            orders: updated_orders
        });
    }

    handleDeleteBuy(order_id, buy_id) {
        var updated_orders = this.state.orders;
        var order = updated_orders.find(order => {
            return order.id == order_id;
        });
        if (order)
        {
            order.buys = order.buys.filter((buy) => {
                return buy.id != buy_id
            });
        }
        this.setState({
            orders: updated_orders
        });
    }

    handleChangeBuy(order_id, buy_id, state) {
        var updated_orders = this.state.orders;
        var order = updated_orders.find(order => {
            return order.id == order_id;
        });
        if (order)
        {
            var buy = order.buys.find(buy => {
                return buy.id == buy_id;
            });

            buy.ticker = (state.ticker != null) ? state.ticker : buy.ticker;
            buy.quantity = (state.quantity != null) ? state.quantity : buy.quantity;
            buy.price = (state.price != null) ? state.price : buy.price;
        }
        this.setState({
            orders: updated_orders
        });
    }

    render() {
        const portfolio_rows = [];

        var portfolio_total = 0;
        this.state.orders.forEach(order => {

            order.buys.forEach(buy => {
                portfolio_total += buy.quantity * buy.price;
            });

            portfolio_rows.push(
                <Order order={order}
                       key={"order_" + order.id}
                       onDelete={() => this.handleDeleteOrder(order.id)}
                       onCreateBuy={this.handleCreateBuy}
                       onDeleteBuy={this.handleDeleteBuy}
                       onBuyChange={this.handleChangeBuy}/>
            );
        })

        return (
            <div>
                <span className="right">
                    <input type="file" id="file" onChange={e => {
                        this.handleFileSelect(e);
                        e.preventDefault();
                    }}></input>
                    <label htmlFor="file">[open]</label>
                    <a href="#" onClick={e => {
                        this.downloadPortfolio();
                        e.preventDefault();
                    }}>[save]</a>
                </span>
                <h1>Orders <a href="#" onClick={e => {
                    this.handleCreateOrder();
                    e.preventDefault();
                }}>[+]</a></h1>
                <div className="order">
                    <span className="line"><b>total</b>: <StaticField value={portfolio_total} fieldType={FieldType.CURRENCY} /></span>
                </div>
                {portfolio_rows}
            </div>
        );
    }
}

const PLACEHOLDER_DATA = {
    orders : [
        {
            id : 0,
            date : new Date(),
            buys : [
                {
                    id: 0,
                    ticker : "",
                    quantity: 0,
                    price: 0.0
                }
            ],
            next_buy_id : 1
        }
    ]
}

ReactDOM.render(
    <Portfolio data={PLACEHOLDER_DATA} />,
    document.getElementById('app')
);
