var jBinary = require('jbinary');

function getdB(b1,b2) {
    return b1+b2/256;
}

function latitudeCalc(DD,M,mm){
    return DD + (M + mm / 65536)/ 60
}

function is_type(de_type){
    return function(context) {return context.de_type==de_type;};
}

function decodeTagItem(tag_name, tag_bytes) {

    const fac_channel_parameters = {
        base_enhancement_flag: ['bitfield', 1],
        robustness_mode: ['bitfield', 2],
        rm_flag: ['bitfield', 1],
        spectrum_occupancy: ['bitfield', 3],
        interleaver_depth_flag: ['bitfield', 1],
        msc_mode: ['bitfield', 2],
        sdc_mode: ['bitfield', 1],
        num_services: ['bitfield', 4],
        reconfiguration_index: ['bitfield', 3],
        toggle_flag: ['bitfield', 1],
        rfu: ['bitfield', 1]
    };

    const fac_service_parameters = {
        service_identifier: ['bitfield', 2],
        short_id: ['bitfield', 2],
        audio_ca_indication: ['bitfield', 1],
        language: ['bitfield', 4],
        audio_data_flag: ['bitfield', 1],
        service_descriptor: ['bitfield', 5],
        data_ca_indication: ['bitfield', 1],
        rfa: ['bitfield', 6]
    };


    const SDCDataEntityBodyTypeset = {
        'jBinary.all': 'de_body',
        'jBinary.littleEndian': false,
        de0_body: {
            protection_level_A: ['bitfield', 2],
            protection_level_B: ['bitfield', 2],
            stream_descriptions: ['array', 
            {
                data_length_A: ['bitfield', 12],
                data_length_B: ['bitfield', 12]
            }]

        },
        de1_body: {
            short_id: ['bitfield', 2],
            rfu: ['bitfield', 2],
            label: 'string'
        },
        de2_body: {
            short_id: ['bitfield', 2],
            audio_ca_flag: ['bitfield', 1],
            data_ca_flag: ['bitfield', 1],
            ca_specific_info: ['array', 'uint8']
        },
        de3_body: {
            synchronous_multiplex_flag: ['bitfield', 1],
            layer_flag: ['bitfield', 1],
            service_restriction_flag: ['bitfield', 1],
            region_schedule_flag: ['bitfield', 1],
            service_restriction_field: ['if', 'service_restriction_flag', 
                {
                    short_id_flags: ['array', ['bitfield', 1], 4],
                    rfa: ['bitfield', 4]

                },
                {}],
            region_schedule_field: ['if', 'region_schedule_flag',
                {
                    region_id: ['bitfield', 4],
                    schedule_id: ['bitfield', 4],
                }],
            frequencies: ['array', 'uint16']
        },
        de4_body: {
            schedule_id: ['bitfield', 4],
            day_code: ['bitfield', 7],
            start_time: ['bitfield', 11],
            duration: ['bitfield', 14]
        },
        de5_body: {
            short_id: ['bitfield', 2],
            stream_id: ['bitfield', 2],
            packet_mode_indicator: ['bitfield', 1],
            descriptor: ['if', function(context) {context.packet_mode_indicator==0},
                {
                    rfa: ['bitfield', 3],
                    enhancement_flag: ['bitfield', 1],
                    application_domain: ['bitfield', 3]
                },
                {
                    data_unit_indicator: ['bitfield', 1],
                    packet_id: ['bitfield', 2],
                    enhancement_flag: ['bitfield', 1],
                    application_domain: ['bitfield', 3],
                    packet_length: ['bitfield', 8]
                }]                
        },
        de6_body: {
            short_id_flags: ['array', ['bitfield', 1], 4],
            same_multiplex_other_service_flag: ['bitfield', 1],
            short_id_announcement_id: ['bitfield', 2],
            rfa: ['bitfield', 1],
            announcement_support_flags: ['bitfield', 10],
            announcement_switching_flags: ['bitfield', 10]
        },
        de7_body: {
            region_id: ['bitfield', 4],
            latitude: ['bitfield', 8],
            longitude: ['bitfield', 9],
            latitude_extent: ['bitfield', 7],
            longitude_extent: ['bitfield', 8],
            ciraf_zones: ['array', 'uint8']
        },
        de8_body: {
            mjd: ['bitfield', 17],
            utc: {
                hours: ['bitfield', 5],
                minutes: ['bitfield', 6],
            },
            rfu: ['bitfield', 2],
            local_time_offset_sense: ['bitfield', 1],
            local_time_offset_value: ['bitfield', 5]
        },
        de9_body: {
            short_id: ['bitfield', 2],
            stream_id: ['bitfield', 2],
            audio_coding: ['bitfield', 2],
            sbr_flag: ['bitfield', 1],
            audio_mode: ['bitfield', 2],
            audio_sampling_rate: ['bitfield', 3],
            text_flag: ['bitfield', 1],
            enhancement_flag: ['bitfield', 1],
            coder_field: ['bitfield', 5],
            rfa: ['bitfield', 1],
            codec_specific_config: ['array', 'uint8']
        },
        de10_body: {
            base_enhancement_flag: ['bitfield', 1],
            robustness_mode: ['bitfield', 2],
            rm_flag: ['bitfield', 1],
            spectrum_occupancy: ['bitfield', 3],
            interleaver_depth_flag: ['bitfield', 1],
            msc_mode: ['bitfield', 2],
            sdc_mode: ['bitfield', 1],
            num_services: ['bitfield', 4],
            rfa: ['bitfield', 4],
            rfu: ['bitfield', 1]
        },
        de11_body: {
            short_id_announcement_id_flag: ['bitfield', 1],
            short_id_announcement_id_field: ['bitfield', 2],
            region_schedule_flag: ['bitfield', 1],
            same_service_flag: ['bitfield', 1],
            rfa: ['bitfield', 2],
            system_id: ['bitfield', 5],
            region_schedule_field: ['if', 'region_schedule_flag',
            {
                region_id: ['bitfield', 4],
                schedule_id: ['bitfield', 4],
            }],
            other_service_id: 
                ['if', function(context) {return context.system_id==2 || context.system_id==5 || context.system_id==8;}, {},
                ['if', function(context) {return context.system_id==4 || context.system_id==7 || context.system_id==10;}, ['bitfield', 16],
                ['if', function(context) {return context.system_id==0 || context.system_id==1 || context.system_id==3 || context.system_id==6 || context.system_id==9;}, ['bitfield', 24],
                ['if', function(context) {return context.system_id==11;}, ['bitfield', 32]
            ]]]],                    
            frequencies: ['array', ['if', function(context) {return context.system_id<=2;}, 'uint16', 'uint8']]
        },
        de12_body: {
            short_id: ['bitfield', 2],
            rfu: ['bitfield', 2],
            language_code: ['string', 3],
            country_code: ['string', 2],
        },
        de13_body: {
            region_id: ['bitfield', 4],
            squares: ['array', {
                rfu: ['bitfield', 1],
                square_latitude: ['bitfield', 12],
                square_longitude: ['bitfield', 13],
                square_latitude_extent: ['bitfield', 11],
                square_longitude_extent: ['bitfield', 11],
            }]
        },
        de14_body: {
            stream_id: ['bitfield', 2],
            rfu: ['bitfield', 2],
            r: ['bitfield', 8],
            c: ['bitfield', 8],
            packet_length: ['bitfield', 8],
        },
        de15_body: {
            extension_type: ['bitfield', 4],
            extension_body: ['array', 'uint8']
        },
        unknown_de_body: {
            first_nibble: ['bitfield', 4],
            the_rest: ['array', 'uint8']
        },

        de_body: {
            de_type: ['bitfield',4],
            body: ['if', function(context) {return context.de_type==0 && this.binary.view.buffer.length==1, {padding: ['bitfield: 4']}},
                ['if', is_type(0), 'de0_body',
                ['if', function(context) {return context.de_type==1}, 'de1_body',
                ['if', function(context) {return context.de_type==2}, 'de2_body',
                ['if', function(context) {return context.de_type==3}, 'de3_body',
                ['if', function(context) {return context.de_type==4}, 'de4_body',
                ['if', function(context) {return context.de_type==5}, 'de5_body',
                ['if', function(context) {return context.de_type==6}, 'de6_body',
                ['if', function(context) {return context.de_type==7}, 'de7_body',
                ['if', function(context) {return context.de_type==8}, 'de8_body',
                ['if', function(context) {return context.de_type==9}, 'de9_body',
                ['if', function(context) {return context.de_type==10}, 'de10_body',
                ['if', function(context) {return context.de_type==11}, 'de11_body',
                ['if', function(context) {return context.de_type==12}, 'de12_body',
                ['if', function(context) {return context.de_type==13}, 'de13_body',
                ['if', function(context) {return context.de_type==14}, 'de14_body',
                ['if', function(context) {return context.de_type==15}, 'de15_body',
                'unknown_de_body']]]]]]]]]]]]]]]]]
        }
    };

    const SDCDataEntityTypeset = {
        'jBinary.littleEndian': false,
        'jBinary.all': 'data_entity_array',
        data_entity: {
            length_of_body: ['bitfield', 7],
            version: ['bitfield', 1],
            data_entity_content: ['if', function(context) {return context.length_of_body==0;}, {padding: 0},
                jBinary.Template({
                    baseType: ['binary', function(context) {return context.length_of_body + 1}, SDCDataEntityBodyTypeset],
                    read: function () {
                        try {
                            return this.baseRead().readAll();
                        } catch (err)
                        {
                            return "error (might be padding). TODO: deal with padding properly";
                        }
                        
                    }
                })]
        },
        data_entity_array: ['array', 'data_entity']
    };

    const TAGItemTypeset = {
        'jBinary.littleEndian': false,
        fxp8_8: jBinary.Template({
            baseType: 'int16',
            read: function () {
                return this.baseRead() / 256;
            },
            write: function (value) {
                this.baseWrite(value * 256);
            }

        }),
        ufxp8_8: jBinary.Template({
            baseType: 'uint16',
            read: function () {
                return this.baseRead() / 256;
            },
            write: function (value) {
                this.baseWrite(value * 256);
            }

        }),
        fxp16_8:jBinary.Template({
            baseType: {i: 'int16', f: 'uint8'},
            read: function () {
                var b = this.baseRead();
                return b.i + b.f/256;
            },
            write: function (value) {
                var i = Math.floor(value);
                var b = (value - i) *256;
                this.baseWrite({
                    i: i,
                    b: b
                });
            }

        }),
        nfxp7_1: jBinary.Template({
            baseType: 'uint8',
            read: function () {
                return -this.baseRead() / 2;
            },
            write: function (value) {
                this.baseWrite(value * 2);
            }

        }),
 
        dlfc: { logical_frame_count: 'uint32' },
               rpro: {profile: 'char'},
               rinf: {
                   manufacturer: ['string', 4],
                   implementation: ['string', 2],
                   major_version: ['string', 2],
                   minor_version: ['string', 2],
                   serial: ['string', 6]
                },
                '*ptr': {
                    protocol_name: ['string', 4],
                    major_revision: 'uint16',
                    minor_revision: 'uint16'
                },
                fmjd: {
                    mjd: 'uint32',
                    fractional_day: 'uint32'
                },

                'time':{
                    date_time:['string',25]
                },
                'rdmo':{
                    demodulator_type:['string',4]
                },
                'rfre':{
                    reception_frequency: 'uint32'
                },
                'ract':{
                    isActive: ['string',1]
                },
                'rser':{
                    service: 'uint8'
                },
                'rtty':{
                    stream0: 'uint8',
                    stream1: 'uint8',
                    stream2: 'uint8',
                    stream3: 'uint8'
                },
                'robm':{
                    robustness_mode: 'uint8'
                },
                'fac_':{
                    channel_parameters: fac_channel_parameters,
                    service_parameters: ['if', function(context) {return this.binary.view.buffer.length==9},
                        ['array', fac_service_parameters, 1], ['array',fac_service_parameters, 2]
                    ],
                    crc: ['bitfield', 8]
                },
                'sdc_': {
                    rfu: ['bitfield', 4],
                    afs: ['bitfield', 4],
                    sdc_data: jBinary.Template({
                        baseType: ['binary', function(context) {return this.binary.view.buffer.length-3}, SDCDataEntityTypeset],
                        read: function () {
                            return this.baseRead().readAll();
                        }
                    })
                },
                'rbpN': [
                    'if', function (context) {
                        var len = this.binary.view.buffer.length;
                        return len > 0;
                    },
                    {

                        errors: 'uint16',
                        bits: 'uint16'
                    },
                    {}
                ],

                'rbp0': 'rbpN',
                'rbp1': 'rbpN',
                'rbp2': 'rbpN',
                'rbp3': 'rbpN',

                'rafs':{
                    nAudioUnits:'uint8',
                    errorFlags:['array', ['bitfield', 1], 'nAudioUnits']
                },
                
                'rast':{
                    totalFrames:'uint16',
                    correctFrames:'uint16'
                },

                'str0':{
                    streamData:['array','uint8']
                },
                'str1':{
                    streamData:['array','uint8']
                },
                'str2':{
                    streamData:['array','uint8']
                },
                'str3':{
                    streamData:['array','uint8']
                },
                reas_value: {
                    C: ['bitfield', 1],
                    rfu: ['bitfield', 2],
                    UHS: ['bitfield', 1],
                    SBR: ['bitfield', 1],
                    SE1: ['bitfield', 1],
                    SE2: ['bitfield', 1],
                    ULS: ['bitfield', 1]
                },
                'reas':{
                    audioStatus:['array','reas_value']
                },
                'rsnr':{
                    SNR: ['array', 'fxp8_8']
                },
                'rdbv':{
                    signalStrengthValues:['array', 'fxp8_8']
                },
                'rsta':{
                    sync:'uint8',
                    FAC_decoding:'uint8',
                    SDC_decoding:'uint8',
                    AudioDecoding:'uint8'
                },
                'rbw_':{
                    filterBandwidth:'fxp8_8' //in Hz but is the same equation                    
                },
                'rwmf':{
                    weightedMER:['array', 'fxp8_8']
                },
                'rwmm':{//exactly the same as above, except for a different cell
                    weightedMER:['array', 'fxp8_8']    
                },
                'rmer':{
                    actualMER:['array', 'fxp8_8']
                },
                'rdel':{
                    delayWindow:['array',
                    {//there is a different object within this object observe the {}
                        pcent:'uint8',
                        windowLength:'fxp8_8'
                    }
                ]
                },
                'rdop':{
                    dopplerEst:'ufxp8_8'//in Hz
                },
                'rpsd':{
                    power_spectral_density_values: ['array', 'nfxp7_1']
                },
                'rnic':{
                    intfreq:'fxp16_8',//in Hz
                    inr:'ufxp8_8',//in db
                    icr:'fxp8_8'

                },
                'rnip':{
                    intfreqPSD: 'fxp16_8',
                    isr:'fxp8_8'
                },
                'rpir': {
                    pir_start: 'fxp8_8',
                    pir_end: 'fxp8_8',
                    pir: ['array', 'nfxp7_1']
                },
                'rgps':{
                    'position':{
                        source:'uint8',//first byte shows source
                        nSatellite:'uint8',//number of satelites that can be seen
                        latitude:function(){
                            return latitudeCalc(this.binary.read('int16'),this.binary.read('uint8'),this.binary.read('uint16'));//works out latitude from numbers given
                        },
                        longitude:function(){
                            return latitudeCalc(this.binary.read('int16'),this.binary.read('uint8'),this.binary.read('uint16'));//works out latitude from numbers given
                        },
                        altitude:'fxp16_8'
                    },
                    'dateTime':{
                        hours:'uint8',//hours, 24hr format, utc time
                        minutes:'uint8',
                        seconds:'uint8',
                        //now time for the day
                        year:'uint16',
                        month:'uint8',
                        day:'uint8'
                    },
                    'movement':{
                        speed:'uint16',//the speed over ground, m/s, should be if stationary (obv)
                        direction:'uint16'//direction, degrees from north, should be 0 if stationary
                    }

                },
                'rpil':{
                    symbolNum:'uint8',//number of symbols
                    symbolRep:'uint8',//how long until symbols repeat
                    rfu:'uint16',//just some spare bytes
                    //symbols
                    symbols:[
                        'array',{
                            pilotNum:'uint8',
                            pilotOffset:'uint8',
                            blockExponent:'uint16',
                            symbols:[
                                'array',
                                {
                                    I:'int16', 
                                    Q:'int16'
                                },
                                'pilotNum'
                            ]
                        }
                    ]
                },
                'rama':{
                    codecType:'uint8',//can i stick an If statement in here to check for the standard/non standard codecs?, currently assuming it is = 192(10)
                    audioCfgLen:'uint8',
                    audioCfg:['array','uint8','audioCfgLen'],
                    audio: ['array', 'uint8']
                },
                'sdci':{
                    rfu: ['bitfield', 4],
                    PLA: ['bitfield', 2],
                    PLB: ['bitfield', 2],
                    streamDescription: ['array', ['array', 'uint8', 3] ]                     // TODO: add decoding once the SDC data entities are implemented
                },

                unknown: {
                   tag_value: ['array', 'uint8']
               }
    };

    const tagItemTypeName = (tag_name in TAGItemTypeset) ? tag_name : 'unknown';

    if (tag_bytes.length == 0) {
        return {};
    }
    try {   
        return (new jBinary(tag_bytes, TAGItemTypeset)).read(tagItemTypeName);
    } catch(err)
    {
        return {"Error" :  err.code};
    }
}

function decode(bytes) {

    const AFFrameTypeset = {
        'jBinary.all': 'AFFrame',
        'jBinary.littleEndian': false,
        AFFrame: {
            sync: ['const', ['string', 2], 'AF', true],
            len: 'uint32',
            seq: 'uint16',
            cf: ['bitfield', 1],
            maj_ver: ['bitfield', 3],
            min_ver: ['bitfield', 4],
            pt: ['const', ['char', 'T'], true],
            tag_packet: ['array', 'uint8', 'len'],
            crc: 'uint16'
        }
    };


    const TAGPacketTypeset = {
        'jBinary.all': 'TAGPacket',
        'jBinary.littleEndian': false,
        TAGItem: {
            tag_name: ['string', 4],
            tag_length: 'uint32',
            tag_value_with_padding: ['array', 'uint8', function(context) {
                return Math.ceil(context.tag_length/8.0);
            }]
        },
        TAGPacket: ['array', 'TAGItem']
    };

 
    const afJBinary = new jBinary(bytes, AFFrameTypeset);
    const af_packet = afJBinary.readAll();
    const tagPacketJBinary = new jBinary(af_packet.tag_packet, TAGPacketTypeset);

    const tag_items = tagPacketJBinary.readAll();

    var decoded_tag_items =  tag_items.map(
        function(tag_item) {
            return {
                tag_name: tag_item.tag_name,
                tag_content: decodeTagItem(tag_item.tag_name, tag_item.tag_value_with_padding)
            };
        }
    );

    return rsciArrayToMap(decoded_tag_items);
}

function rsciArrayToMap(tagItemArray)
{
    tag_map = {};
    tagItemArray.forEach(tagItem => {
        var tagName = tagItem.tag_name;
        var n=2;
        while (tagName in tag_map) { // already exists - append a number to make it unique
            tagName = tagItem.tag_name + n.toString();
            n++;
        }

        if (tagItem.tag_name == "sdc_") {
            tag_map[tagName] = {};
            tagItem.tag_content.sdc_data.forEach(de => {
                var n = 2;
                if ("de_type" in de.data_entity_content)
                {
                    deName = "data_entity"+de.data_entity_content.de_type.toString();
                    while (deName in tag_map[tagName]) {
                        deName = "data_entity"+de.data_entity_content.de_type.toString()+"_"+n.toString();
                        n++;
                    }
                    tag_map[tagName][deName] = {
                        version: de.data_entity_content.version,
                        ... de.data_entity_content.body
                    }
                }
            });

        }
        else
        {         
            tag_map[tagName] = tagItem.tag_content;
        }

    });

    return tag_map;
}

module.exports = { decode };