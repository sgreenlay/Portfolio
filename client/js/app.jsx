import React from 'react';
import ReactDOM from 'react-dom';

import './app.css';

import CSV from 'csv';

const FieldType = {
    TEXT: 'text',
    NUMBER: 'number',
    DATE: 'date',
    CURRENCY: 'currency',
    PERCENT : 'percent'
}

const fieldValue = (value, fieldType, editing) => {
    if (fieldType == FieldType.CURRENCY || fieldType == FieldType.PERCENT)
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
    
    if (fieldType == FieldType.CURRENCY || 
        fieldType == FieldType.NUMBER || 
        fieldType == FieldType.PERCENT)
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
        if (fieldType == FieldType.PERCENT)
        {
            return value.toFixed(1);
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

        const rows = [];
        const classes = [];

        const value = formattedFieldValue(this.props.value, this.props.fieldType);

        if (fieldType == FieldType.CURRENCY)
        {
            rows.push(<span key="currency_prefix">$</span>);
        }

        if (fieldType == FieldType.PERCENT)
        {
            if (value < 0)
            {
                classes.push("loss");
            }
            else if (value > 0)
            {
                classes.push("gain");
            }
            else if (value == 0)
            {
                classes.push("neutral");
            }
        }

        rows.push(<span key="field_value">{value}</span>);

        if (fieldType == FieldType.PERCENT)
        {
            rows.push(<span key="percent_suffix">%</span>);
        }

        return (
            <span className={classes}>{rows}</span>
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
    DATE : 'date',
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
                <a className="right action" href="#" onClick={e => {
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

        this.handleChange = this.handleChange.bind(this);
        this.handleDelete = this.handleDelete.bind(this);
        this.handleCreateBuy = this.handleCreateBuy.bind(this);
        this.handleDeleteBuy = this.handleDeleteBuy.bind(this);
        this.handleBuyChange = this.handleBuyChange.bind(this);
    }

    handleChange(field, value) {
        if (field == Field.DATE)
        {
            if (this.props.onChange)
            {
                this.props.onChange({
                    date: new Date(Date.parse(value))
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
        const { handleChange } = this;
        const { order } = this.props;

        var order_total = 0;
        order.buys.forEach((buy) => {
            order_total += buy.quantity * buy.price;
        });

        return (
            <div className="order">
                <a className="right action" href="#" onClick={e => {
                    this.handleDelete();
                    e.preventDefault();
                }}>[delete]</a>
                <h2 key={"order_" + order.id + "title"}>
                    <InteractiveField key={"order_" + order.id + "title_value"}
                                 value={order.date}
                                 fieldType={FieldType.DATE}
                                 onChange={value => {
                                     handleChange(Field.DATE, value);
                                 }} onBlur={value => {
                                     handleChange(Field.DATE, value);
                                 }} /> <a href="#" onClick={e => {
                        this.handleCreateBuy();
                        e.preventDefault();
                    }}>[+]</a>
                </h2>
                <div key={"order_" + order.id + "buys"} className="line">
                    {order.buys.map((buy) => {
                        return <Buy key={"order_" + order.id + "_buy_" + buy.id} buy={buy}
                            onChange={update => {
                                this.handleBuyChange(buy.id, update);
                            }}
                            onDelete={() => {
                                this.handleDeleteBuy(buy.id);
                            }}
                        />
                    })}
                </div>
                <b key={"order_" + order.id + "total"}>total</b>: <StaticField value={order_total} fieldType={FieldType.CURRENCY} />
            </div>
        );
    }
}

class Orders extends React.Component {

    constructor(props) {
        super(props);

        this.handleCreateOrder = this.handleCreateOrder.bind(this);
        this.handleDeleteOrder = this.handleDeleteOrder.bind(this);
        this.handleChangeOrder = this.handleChangeOrder.bind(this);
        this.handleCreateBuy = this.handleCreateBuy.bind(this);
        this.handleDeleteBuy = this.handleDeleteBuy.bind(this);
        this.handleChangeBuy = this.handleChangeBuy.bind(this);
    }

    handleCreateOrder() {
        var order = {
            id : this.props.state.next_order_id,
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
        var updated_orders = this.props.state.orders;
        updated_orders.unshift(order);

        this.props.onOrdersChanged(updated_orders, this.props.state.next_order_id + 1);
    }

    handleDeleteOrder(order_id) {
        var updated_orders = this.props.state.orders.filter((order) => {
            return order.id != order_id
        });

        this.props.onOrdersChanged(updated_orders);
    }

    handleCreateBuy(order_id) {
        var updated_orders = this.props.state.orders;
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
        this.props.onOrdersChanged(updated_orders);
    }

    handleDeleteBuy(order_id, buy_id) {
        var updated_orders = this.props.state.orders;
        var order = updated_orders.find(order => {
            return order.id == order_id;
        });
        if (order)
        {
            order.buys = order.buys.filter((buy) => {
                return buy.id != buy_id
            });
        }
        this.props.onOrdersChanged(updated_orders);
    }

    handleChangeOrder(order_id, state) {
        var updated_orders = this.props.state.orders;
        var order = updated_orders.find(order => {
            return order.id == order_id;
        });
        if (order)
        {
            order.date = (state.date != null) ? state.date : order.date;
        }
        this.props.onOrdersChanged(updated_orders);
    }

    handleChangeBuy(order_id, buy_id, state) {
        var updated_orders = this.props.state.orders;
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
        this.props.onOrdersChanged(updated_orders);
    }

    render() {
        var portfolio_total = 0;
        this.props.state.orders.forEach(order => {
            order.buys.forEach(buy => {
                portfolio_total += buy.quantity * buy.price;
            });
        })

        return (
            <div>
                <div className="order">
                    <span className="right action"><a href="#" onClick={e => {
                        this.handleCreateOrder();
                        e.preventDefault();
                    }}>[add]</a></span>
                    <span className="line"><b>total</b>: <StaticField value={portfolio_total} fieldType={FieldType.CURRENCY} /></span>
                </div>
                {this.props.state.orders.map(order => {
                    return <Order order={order}
                                key={"order_" + order.id}
                                onDelete={() => this.handleDeleteOrder(order.id)}
                                onChange={(update) => this.handleChangeOrder(order.id, update)}
                                onCreateBuy={this.handleCreateBuy}
                                onDeleteBuy={this.handleDeleteBuy}
                                onBuyChange={this.handleChangeBuy}/>
                })}
            </div>
        );
    }
}

class Portfolio extends React.Component {
    render() {
        const { orders } = this.props.state;

        var stocks = {};
        orders.forEach((order) => {
            order.buys.forEach((buy) => {
                var stock_buy = {
                    date : order.date,
                    quantity : buy.quantity,
                    price : buy.price
                };

                if (buy.ticker in stocks)
                {
                    stocks[buy.ticker].buys.push(stock_buy);
                }
                else
                {
                    stocks[buy.ticker] = {
                        buys : [ stock_buy ]
                    };
                }
            });
        });

        Object.keys(stocks).forEach(ticker => {
            var total_count = 0;
            stocks[ticker].buys.forEach((buy) => {
                total_count += buy.quantity;
            });
            stocks[ticker].total_count = total_count;
        });

        return (
            <div>
                {Object.keys(stocks).sort().map(ticker => {
                    const stock = stocks[ticker];
                    return (
                        <div key={ticker} className="order">
                            <h2>
                                <StaticField value={ticker} />
                                <span className="right">
                                    <StaticField value={stock.total_count} />
                                    &nbsp;⨯&nbsp;
                                    <StaticField value={0.00} fieldType={FieldType.CURRENCY} />
                                    &nbsp;=&nbsp; 
                                    <StaticField value={0.00} fieldType={FieldType.CURRENCY} /> (
                                    <StaticField value={0.00} fieldType={FieldType.PERCENT} />
                                    )
                                </span>
                            </h2>
                            {stock.buys.map(buy => {
                                return (
                                    <div key={buy.date} className="buy line">
                                        <StaticField value={buy.quantity} fieldType={FieldType.NUMBER} />
                                        &nbsp;⨯&nbsp;
                                        <StaticField value={buy.price} fieldType={FieldType.CURRENCY} />
                                        &nbsp;🡒&nbsp;
                                        <StaticField value={0.00} fieldType={FieldType.CURRENCY} /> (
                                        <StaticField value={0.00} fieldType={FieldType.PERCENT} />
                                        ) + <StaticField value={0.00} fieldType={FieldType.CURRENCY} /> DIV (
                                        <StaticField value={0.00} fieldType={FieldType.PERCENT} />
                                        )
                                    </div>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        );
    }
}

class Application extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            orders: props.data.orders,
            next_order_id : props.data.orders.length,
            current_page: 'orders'
        };

        this.handleOrdersChanged = this.handleOrdersChanged.bind(this);
        this.handlePageChange = this.handlePageChange.bind(this);
        this.handleFileSelect = this.handleFileSelect.bind(this);
        this.handleFileLoad = this.handleFileLoad.bind(this);
    }

    handleOrdersChanged(updated_orders, updated_next_order_id) {
        this.setState({
            orders: updated_orders,
            next_order_id: updated_next_order_id ? updated_next_order_id : this.state.next_order_id
        });
    }

    handlePageChange(e) {
        this.setState({
            current_page: e.target.value
        });
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
        const data = CSV.parse(text);

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
            next_order_id: next_order_id
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
        element.setAttribute('download', "portfolio.csv");

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }

    render() {
        return (
            <div>
                <span className="right action">
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
                <h1>
                    <select onChange={this.handlePageChange} value={this.state.current_page}>
                        <option value="orders">[Orders]</option>
                        <option value="portfolio">[Portfolio]</option>
                    </select>
                </h1>

                { /* TODO: replace with a Router */ }
                {{
                    orders: <Orders state={this.state} onOrdersChanged={this.handleOrdersChanged} />,
                    portfolio: <Portfolio state={this.state} />
                }[this.state.current_page]}
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
    <Application data={PLACEHOLDER_DATA} />,
    document.getElementById('app')
);
