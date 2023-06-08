import React, { useEffect, useState } from 'react';
import style from './MemberDeliveryServiceModal.module.css';
import Image from 'next/image';
import { deliveryTimeList } from '@/data/deliveryTimeList';
import { DeliveryTimeType } from '@/types/DeliveryTimeType';
import { mapToBE } from './globalfunctions/mapToBE';
import Swal from 'sweetalert2'
import GiftCardNumberModal from './GiftCardNumberModal';
import { useRouter } from 'next/router';

export interface deliveryAddressType {
    delivertAddressId: number,
    isDefault: boolean, // 0: default 배송지 X, 1: default 배송지 O
    deliveryName: string,
    name: string,
    phoneNumber: string,
    postCode: string,
    address: string,
    detailAddress: string, // address에 붙여서 back에 보낼 예정
    requestInfo: string
    // requestDeliveryTime: string , step02에서 선택될 정보
}

export interface requestDataType {
    posId: number,
    storeId: number,
    deliveryName: string,
    userName: string,
    address: string,
    postCode: string,
    requestDeliveryTime: string,
    requestInfo: string,
    phoneNumber: string
}

export default function MemberDeliveryServiceModal(
    props: { 
        isOpen: boolean, 
        setIsOpen: React.Dispatch<React.SetStateAction<boolean>> 
    }) {

    const router = useRouter();
    const [deliveryData, setDeliveryData] = useState<deliveryAddressType[]>([] as deliveryAddressType[]);

    const [step, setStep] = React.useState(0)
    const [confirm, setConfirm] = React.useState(false)
    const [isInnerModal, setIsInnerModal] = React.useState(false)
    const [isGiftCardNumber, setIsGiftCardNumber] = React.useState(false)
    const [serialNumber, setSerialNumber] = React.useState<string>('');

    const [finishedAt, setFinishedAt] = useState<string>('');
    const [requestInputData, setRequestInputData] = useState<requestDataType>({} as requestDataType);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setDeliveryData({
            ...deliveryData,
            [name]: value
        })
    }

    useEffect(() => {
        console.log('requestInputData', requestInputData)
        if(requestInputData.requestInfo === null) {
            setRequestInputData({
                ...requestInputData,
                requestInfo: '요청사항 없음'
            })
        }
    }, [requestInputData])

    const innerData = [
        <Step01 
            deliveryData={deliveryData}
            handleChange={handleChange}
            setDeliveryData={setDeliveryData}
            requestInputData={requestInputData}
            setRequestInputData={setRequestInputData}
        />,
        <Step02 
            finishedAt={finishedAt} 
            setFinishedAt={setFinishedAt} 
            requestInputData={requestInputData}
            setRequestInputData={setRequestInputData}
        />,
    ]

    useEffect(() => {
        console.log('confirm', confirm)
        console.log('step', step)
        if (confirm) {
            nextStep(step)
        } 
    }, [confirm, finishedAt])

    const nextStep = (step: number) => {
        if (step === 1) {
            Swal.fire({
                title: '상품권 사용',
                html: '모바일 상품권을 사용하시겠습니까?<br>초과된 금액은 사용하실 수 없습니다.',
                showCancelButton: true,
                // imageUrl: '/images/checkWhite.png',
                confirmButtonText: '예',
                cancelButtonText: '아니오',

                customClass: {
                    popup: 'my-swal-popup',
                },
                
            }).then((result) => {
                if(result.isConfirmed) {
                    console.log('예')
                    setIsGiftCardNumber(true)
                    props.setIsOpen(false)
                    return;
                } else {
                    console.log('아니오')
                    router.push('/payments')
                    return;
                }
            })
            return
        }
        setStep(step + 1)
    }

    return(
    <>
    <GiftCardNumberModal show={isGiftCardNumber} onClose={setIsGiftCardNumber} serialNumber={serialNumber} setSerialNumber={setSerialNumber}/>
    { props.isOpen ? 
        <div className={style.overlay}>
        <div className={style.modal}>
        <div className={style.cancel} onClick={()=>props.setIsOpen(false)}>
            <Image
            src='/images/cancel.png'
            alt='cancel'
            className={style.cancel}
            width={30}
            height={30}
            />
        </div>
            {innerData[step]}
            <div className={style.confirmBtn} onClick={()=>nextStep(step)}>
            <Image 
            src='/images/checkWhite.png'
            alt='confirm button'
            width={30}
            height={30}
            />
            <p>확인</p>
            </div>
        </div>
    </div>
    : null}
    
    </>
    )
}

const Step01 = (props:{
    deliveryData: deliveryAddressType[],
    setDeliveryData: React.Dispatch<React.SetStateAction<deliveryAddressType[]>>,
    handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    requestInputData: requestDataType,
    setRequestInputData: React.Dispatch<React.SetStateAction<requestDataType>>
}) => {

    const { deliveryData, handleChange, setDeliveryData } = props

    const url = mapToBE('/api/v1/delivery/list')
    console.log(url)

    useEffect(() => {
        const getData = async () => {
        const res = await fetch(url)
        const data = await res.json()
        console.log(data)
        {
            res.status === 200 ? console.log('success') : console.log('fail')
        }
        setDeliveryData(data)
        }
        getData()
    },[])
    console.log(deliveryData)

    return (
        <div>
            <div className={style.title}>
                <h1>배송지 목록</h1>
            </div>
            <div className={style.subject}>
                    <p>선택</p>
                    <p>배송지명</p>
                    <p>받는 분</p>
                    <p>주소</p>
                    <p>요청사항</p>
            </div>
            {
                deliveryData.map((address) => (
                    <AddressItem 
                    data={address} 
                    key={address.delivertAddressId}
                    requestInputData={props.requestInputData}
                    setRequestInputData={props.setRequestInputData}
                    />
                ))
            }
        </div>
    )
}

const Step02 = (props:{
    finishedAt: string, 
    setFinishedAt: React.Dispatch<React.SetStateAction<string>>,
    requestInputData: requestDataType,
    setRequestInputData: React.Dispatch<React.SetStateAction<requestDataType>>
    }) => {

    const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log(e.target.value)
        props.setFinishedAt(e.target.value)
        props.setRequestInputData({
            ...props.requestInputData,
            requestDeliveryTime: e.target.value
        })
    }

    const { requestInputData,  setRequestInputData } = props

    const url = mapToBE('/api/v1/delivery/select-delivery')
    console.log(url)

    useEffect(() => {
        const getData = async () => {
        const res = await fetch(url)
        const data = await res.json()
        console.log(data)
        {
            res.status === 200 ? console.log('success') : console.log('fail')
        }
        setRequestInputData(data)
        }
        getData()
    },[])
    console.log(requestInputData)

    return (
        
        <div>
            <div className={style.title}>
        <h1>배송 시간선택</h1>
        <hr/>
        </div>

        <div className={style.deliveryTimeList}>
            <form>
            {
                deliveryTimeList && deliveryTimeList.map((time:DeliveryTimeType, index:number) => (
                <div key={time.id}>
                    <label>
                    <input 
                        type='radio' 
                        name='delivery' 
                        value={time.title}
                        onChange={onChangeHandler} 
                    />
                    {time.title}
                    </label>
                <hr/>
                </div>
                ))}
            </form>
        </div>
        </div>
    )
}

const AddressItem = (props:{
    data: deliveryAddressType,
    requestInputData: requestDataType,
    setRequestInputData: React.Dispatch<React.SetStateAction<requestDataType>>
}) => {
    const { data } = props
    const [isCheck, setIsCheck] = useState(false)

    useEffect(() => {
        setIsCheck(data.isDefault)
    },[data.isDefault])

    const handleCheck = () => {
        setIsCheck(!isCheck)
    }

    const handleSetAddress = () => {
        props.setRequestInputData({
            ...props.requestInputData,
            storeId: Number(process.env.NEXT_PUBLIC_ENV_STORE_ID),
            posId: Number(process.env.NEXT_PUBLIC_ENV_POS_ID),
            deliveryName: data.deliveryName,
            userName: data.name,
            phoneNumber: data.phoneNumber,
            postCode: data.postCode,
            address: data.address,
            // detailAddress: data.detailAddress,
            requestInfo: data.requestInfo
        })
    }
    return (
        <div className={style.addressItem} onClick={handleSetAddress}>

            <ul onClick={handleCheck}>
                <li style={{width:'1rem', height:'1rem', marginLeft:'15px', borderRadius: '5px', backgroundColor:  isCheck ? '#4C304F' : '#ffffff', border: '1px solid #333' }}></li>
                <li>
                    <p>{data.deliveryName}</p>
                </li>
                <li>
                    <p>{data.name}</p>
                    <p>{data.phoneNumber}</p>
                </li>
                <li>
                    <p>[{data.postCode}] {data.address}</p>
                </li>
                <li>
                    <p>{data.requestInfo}</p>
                </li>
            </ul>
            <hr className={style.line}/>
        </div>
    )
}