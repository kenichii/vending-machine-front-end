import React, { Fragment } from "react";
import * as api from "../utils/api" 
import './vending-machine.scss'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

const MySwal = withReactContent(Swal)

const Product = (item, addToCart, isView = false, myCash = null) => {
  let image = `/images/${item.name}.jpg`
  
  let isButtonDisabled = parseFloat(item.price) > parseFloat(myCash) || item.stocks <= 0;

  return (
    <div className="selected-content max-w-sm bg-white rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700" key={item._id}>
      {item.name && <img className="p-8 rounded-t-lg" src={image}/>}
      <div className={`content px-5 pb-5`}>
       <h5 className={'text-xl font-semibold tracking-tight text-gray-900 dark:text-white'}>{item.name ? item.name : "NO SELECTED"}</h5>
      <div className="price flex justify-between items-center my-5">
      <span className={'text-3xl font-bold text-gray-900 dark:text-white '}>{item.price ? `$${item.price}`: ''}</span>
      { !isView && <span className="text-sm font-bold text-gray-900 dark:text-white">available stocks: {item.stocks <= 0 ? 'Out of Stocks' : item.stocks}</span> }
      </div>
        {!isView && 
        <button className={`purchase-button
        w-full
        text-white 
        bg-blue-700 
        hover:bg-blue-800 
        focus:ring-4 
        focus:ring-blue-300 
        font-medium 
        rounded-lg 
        text-sm px-5 
        py-2.5 
        text-center 
        dark:bg-blue-600 
        dark:hover:bg-blue-700 
        dark:focus:ring-blue-800
        ${isButtonDisabled ? 'is-disabled' : ''}
        `}
        disabled={isButtonDisabled}
        onClick={() => addToCart(item)}>Purchase</button>}
      </div>
    </div>
  )
}

class VendingMachine extends React.PureComponent {
  constructor(props){
    super(props);
    this.state = { 
      listOfData: [], 
      selectedItem: {}, 
      myCash: 0,
      inputCash: null,
      selectedCurrency: "Currency",
      myChange: 0,
      isLoading: false
    };  
  }

  getListOfItems = async () => {
    const { data } = await api.getListOfChocolates();

    const { result } = data

    this.setState({ listOfData: result.data})
  }

  async componentDidMount() {
    await this.getListOfItems();

    let icash = document.getElementById('icash');

    icash.onkeydown = function(e) {
      if(e.keyCode === 189 || e.keyCode === 190 || e.keyCode === 48) {
        return false
      }
    }
  }

  addToCart = (item) => {
    let { listOfData, selectedItem } = this.state;
     console.log(selectedItem, "selectedItem")
    //  let itemIndex = listOfData.findIndex(i => i._id === item._id);
    //  // let selectedItemIndex = selectedItem.findIndex(i => i._id === item._id);
    //  let data = [ ...listOfData ];
    // data[itemIndex].stocks -= 1;

      // let selectedItemData;
      // selectedItemData = [ ...selectedItem ];


      // if(selectedItemIndex > -1) {
      //   selectedItemData[selectedItemIndex].count += 1;
      // } else {
      //   let addToCartItem = {
      //     name: item.name,
      //     _id: item._id,
      //     count: 1
      //   }
      //   selectedItemData.push(addToCartItem)
      // }
      
     this.setState({ selectedItem: item }); 
  }

  handleChange(event, propName) {
    this.setState({[propName]: event.target.value});
  }

  handleCash(e, state) {
    e.preventDefault();
    
    document.getElementById('icash').value = '';

    let { inputCash, selectedCurrency} = state;
    let formatCash = inputCash;
    if(selectedCurrency === 'c'){
      formatCash = "."+inputCash;
    }

   this.setState((state) =>  ({
     myCash: (parseFloat(state.myCash) + parseFloat(formatCash)).toFixed(2), 
     inputCash: null,
  }));
  }

  proceedPayment(e) {
    // let change = this.state.myCash - this.state.selectedItem.price > 0;
    // let item = `Your ${state.selectedItem.name} have been served. ${change ? `Here is your $${state.myCash - state.selectedItem.price} change.` : ''}`

    let timerInterval;

    Swal.fire({
      //title: 'Auto close alert!',
      html: 'Processing your order.',
      timer: 2000,
      timerProgressBar: true,
      didOpen: () => {
        Swal.showLoading()
        timerInterval = setInterval(() => {
        }, 100)
      },
      willClose: () => {
        clearInterval(timerInterval)
      }
    }).then(async (result) => {
      /* Read more about handling dismissals below */

      let payload = {
        item: this.state.selectedItem,
        cash: parseFloat(this.state.myCash).toFixed(2)
      }

      let res = await api.proceedPayment({body: JSON.stringify(payload)});

      if (result.dismiss === Swal.DismissReason.timer) {
        Swal.fire({
          icon: 'success',
          title: `Your ${this.state.selectedItem.name} have been served`,
          html: parseFloat(res.data.result).toFixed(2) > 0 ? `Here is your $${res.data.result} change.` : '',
        });

        await this.getListOfItems();

        this.setState({
          selectedItem: {}, 
          myCash: 0
        })

      }
    })
  }

  cancelTransaction(event) {
    event.preventDefault(event);

    this.setState({
      selectedItem: {}, 
      myCash: 0
    })
    MySwal.fire({
      icon: 'success',
      title: "Succsesfully cancelled your transaction. Your wallet has been refunded.",
      showConfirmButton: false,
      timer: 2000
    })
  }

  render() {
    let { listOfData, selectedItem, inputCash, selectedCurrency, myCash } = this.state;

    let disableAddCash = !inputCash || selectedCurrency === 'Currency';

    return (
      <Fragment>
        <div className="vending-machine">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid grid-cols-3 gap-4">
              {
                listOfData.map((item) => {
                  return Product(item, this.addToCart, false, myCash)
                })
              }
            </div>
            <div className="summary">
              <div className={`item-content ${selectedItem.price ? 'current-selected' : 'no-selected'}`}>
              <div className="actions">
                <div className="input-cash-content shadow-md">
                  <div>
                    <div className="mb-4 flex">
                      <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                      id="icash" type="number" placeholder="Cash" min="1" onChange={(e) => this.handleChange(e, "inputCash")}/>
                      {/* <input class="w-25 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
                      id="currency" type="string" placeholder="Currency" /> */}
                      <div className="w-52">
                        <select className="form-select appearance-none
                          w-full
                          block
                          px-3
                          py-1.5
                          text-base
                          font-normal
                          text-gray-700
                          bg-white bg-clip-padding bg-no-repeat
                          border border-solid border-gray-300
                          rounded
                          transition
                          ease-in-out
                          m-0
                          focus:text-gray-700 focus:bg-white focus:border-blue-600 focus:outline-none" 
                          onChange={(e) => this.handleChange(e, "selectedCurrency")} 
                          defaultValue={selectedCurrency}
                          aria-label="Default select example">
                            <option selected>Select Currency</option>
                            <option defaultValue="1">c</option>
                            <option defaultValue="2">$</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex">
                      <button className={`mx-2 
                      w-full 
                      text-white 
                      bg-blue-700 
                      hover:bg-blue-800 
                      focus:ring-4 
                      focus:ring-blue-300 
                      font-medium 
                      rounded-lg 
                      text-sm px-5 
                      py-2.5 
                      text-center 
                      dark:bg-blue-600 
                      dark:hover:bg-blue-700 
                      dark:focus:ring-blue-800
                      ${disableAddCash ? 'is-disabled' : ''}
                      `}
                      onClick={(e) => this.handleCash(e, this.state)}
                      disabled={disableAddCash}>INPUT CASH</button>

                      <button className={`mx-2
                       w-full 
                       text-white
                      bg-blue-700 
                      hover:bg-blue-800 
                      focus:ring-4 
                      focus:ring-blue-300 
                      font-medium 
                      rounded-lg 
                      text-sm px-5 
                      py-2.5 
                      text-center 
                      dark:bg-blue-600 
                      dark:hover:bg-blue-700 
                      dark:focus:ring-blue-800
                      ${myCash ? '' : 'is-disabled'}`}
                      disabled={!myCash}
                      onClick={(event) => this.cancelTransaction(event)}
                      >CANCEL</button>

                      <button className={`w-full
                        text-white 
                        bg-blue-700 
                        hover:bg-blue-800 
                        focus:ring-4 
                        focus:ring-blue-300 
                        font-medium 
                        rounded-lg 
                        text-sm 
                        px-5 
                        py-2.5 
                        text-center 
                        dark:bg-blue-600 
                        dark:hover:bg-blue-700 
                        dark:focus:ring-blue-800
                        ${selectedItem.price ? '': 'is-disabled'}
                        `}
                        disabled={!selectedItem.price}
                        onClick={(e) => this.proceedPayment(e)}
                          >
                            PROCESS
                          </button>
                      </div>
                    </div>
                  </div>
                  <div className="my-wallet">
                    MY WALLET: {myCash ? `$${myCash}` : '0.00'}
                  </div>
                </div>
                {/* <div className="my-cash shadow-md">
                  <span>
                    My Cash: {myCash ? `$${myCash}` : '0.00'}
                  </span>
                  <button className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  >CANCEL</button>
                </div>
                <div className="process shadow-md">
                  <span>
                      My Change: {myCash ? `$${myCash}` : '0.00'}
                    </span>
                 
              </div> */}
                { Product(selectedItem, this.addToCart, true)}
              </div>
              
            </div>
          </div>
        </div>
      </Fragment>
    )
  }
}
export default VendingMachine;