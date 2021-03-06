"use strict";

const {host} = require('./config');

// https://github.com/Automattic/expect.js
const expect = require('expect.js');

// require('natty-fetch')已被`webpack`映射到全局`NattyDB`对象
const nattyFetch = require('natty-fetch');

let VERSION;
__BUILD_VERSION__


describe('nattyFetch v' + VERSION + ' Unit Test', function() {

    describe('static',function() {
        it('version v' + VERSION, function() {
            expect(nattyFetch.version).to.equal(VERSION);
        });
    });

    describe('global setting',function() {
        this.timeout(1000*10);
        let defaultGlobalConfig = nattyFetch.getGlobal();
        let defaultGlobalConfigProperties = [
            'data',
            'fit',
            'header',
            'ignoreSelfConcurrent',
            'jsonp',
            'log',
            'method',
            'mock',
            'mockUrl',
            'mockUrlPrefix',
            'process',
            'retry',
            'timeout',
            'url',
            'urlPrefix',
            'withCredentials',
            'traditional'
        ];

        let emptyEvent = nattyFetch._event;

        let resetNattyDBGlobalConfig = function () {
            nattyFetch.setGlobal(defaultGlobalConfig);
        };

        beforeEach(function () {
            resetNattyDBGlobalConfig();
        });

        afterEach(function () {
            // 清理所有事件
            let i;
            for (i in nattyFetch._event) {
                if (i.indexOf('__') === 0) {
                    delete nattyFetch._event[i];
                }
            }
        });

        it('check default global config properties: `nattyFetch.getGlobal()`',function() {
            defaultGlobalConfigProperties.forEach(function (property) {
                expect(defaultGlobalConfig).to.have.key(property);
            });
        });

        it('check `nattyFetch.getGlobal("property")`', function () {
            expect(nattyFetch.getGlobal('jsonp')).to.be(false);
        });

        it('check `nattyFetch.setGlobal(obj)`', function () {
            nattyFetch.setGlobal({
                data: {
                    '_csrf_token': 1
                }
            });
            expect(nattyFetch.getGlobal('data')).to.eql({
                '_csrf_token': 1
            });
            // 还原
            nattyFetch.setGlobal({data: {}});
        });

        it('Context instance would inherit and extend the global config', function () {

            let urlPrefix = 'http://test.com/api';
            let context = nattyFetch.context({
                urlPrefix
            });

            // 继承了所有的全局配置
            // defaultGlobalConfigProperties.forEach(function (property) {
            //     expect(DBC.config).to.have.key(property);
            // });
            // 也扩展了全局配置
            expect(context._config.urlPrefix).to.be(urlPrefix);
        });

        it('Context instance would inherit and extend the global config 2', function () {
            let urlPrefix = 'http://test.com/api';
            nattyFetch.setGlobal({
                urlPrefix: urlPrefix
            });

            let context = nattyFetch.context();

            context.create('order', {
                create: {}
            });

            expect(context.api.order.create.config.urlPrefix).to.be(urlPrefix);
        });

        it('catch error', function (done) {
            nattyFetch.setGlobal({
                urlPrefix: host
            });

            let context = new nattyFetch.context();
            context.create('order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {
                // 调用一个不存在的函数, 触发一个js错误
                notExistedFn();
            })['catch'](function (error) {
                if (window.console) {
                    console.log(error.message);
                    console.error(error.stack);
                } else {
                    C.log(error.message, error.stack);
                }
                done();
            });
        });

        it('check global `resolve`', function (done) {
            nattyFetch.setGlobal({
                urlPrefix: host
            });

            nattyFetch.on('resolve', function (data, config) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });



            let context = nattyFetch.context();
            context.create('order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });

            context.api.order.create().then(function(data) {}, function () {});
        });

        it('check global `reject`', function (done) {
            nattyFetch.setGlobal({
                urlPrefix: host
            });

            nattyFetch.on('reject', function (error, config) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });

            let context = nattyFetch.context();
            context.create('order', {
                create: {
                    url: 'api/return-error',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {}, function () {});
        });

        it('check context `resolve`', function (done) {
            let context = nattyFetch.context({
                urlPrefix: host
            });

            context.on('resolve', function (data, config) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });

            context.create('order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {
            }, function () {

            });
        });

        it('check context `reject`', function (done) {
            let context = nattyFetch.context({
                urlPrefix: host
            });

            context.on('reject', function (error, config) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });

            context.create('order', {
                create: {
                    url: 'api/return-error',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {}, function () {});
        });

        it('check both global and context `resolve`', function (done) {
            let globalResolve = false;
            nattyFetch.setGlobal({
                urlPrefix: host
            });

            nattyFetch.on('resolve', function (content) {
                //console.log(1, content);
                globalResolve = true;
            });

            let context = nattyFetch.context({});

            context.on('resolve', function (content) {
                //console.log(2, content);
                try {
                    expect(globalResolve).to.be(true);
                    expect(content.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });

            context.create('order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {}, function () {});
        });

        it('check both global and context `reject`', function (done) {
            let globalReject = false;
            nattyFetch.setGlobal({
                urlPrefix: host
            });

            nattyFetch.on('reject', function (error) {
                //console.log(1, error);
                globalReject = true;
            });


            let context = nattyFetch.context({
                urlPrefix: host
            });

            context.on('reject', function (error, config) {
                //console.log(2, error);
                try {
                    expect(globalReject).to.be(true);
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });

            context.create('order', {
                create: {
                    url: 'api/return-error',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function(data) {}, function () {});
        });

    });

    describe('api config', function () {
        this.timeout(1000*10);
        let context;

        beforeEach('reset NattyDB context', function () {
            context = nattyFetch.context({
                urlPrefix: host,
                jsonp: true,
                mock: false
            });
        });

        it('both object and function can be used as api\'s config', function () {
            context.create('order', {
                // api 对应 配置
                pay: {},
                // api 对应 返回配置的函数
                create: function () {
                    return {}
                }
            });

            expect(context.api.order).to.be.a('object');
            expect(context.api.order.pay).to.be.a('function');
            expect(context.api.order.create).to.be.a('function');
        });

        it('`mock` option', function () {
            context.create('order', {
                pay: {
                    mock: true
                },
                create: {
                    mock: false
                },
                close: {
                    // 此处mock的值等于context.mock
                }
            });

            expect(context.api.order.pay.config.mock).to.be(true);
            expect(context.api.order.create.config.mock).to.be(false);
            expect(context.api.order.close.config.mock).to.be(false);
        });

        it('`mock` value from global', function () {
            let context = nattyFetch.context();
            context.create('order', {
                pay: {
                    // 这个mock等于全局mock值
                }
            });

            expect(context.api.order.pay.config.mock).to.be(false);
        });


        it('`mockUrlPrefix` value from context', function () {
            let context  = nattyFetch.context({
                // NOTE 当`mock`为true时, 才会处理`mockUrl`的值
                mock: true,
                mockUrlPrefix: './mock/'
            });
            context.create('order', {
                pay: {
                    mockUrl: 'pay'
                },
                create: {
                    mockUrl: '../create'
                },
                close: {
                    mockUrl: 'https://www.demo.com/close'
                }
            });

            expect(context.api.order.pay.config.mockUrl).to.be('./mock/pay');
            expect(context.api.order.create.config.mockUrl).to.be('../create');
            expect(context.api.order.close.config.mockUrl).to.be('https://www.demo.com/close');
        });

        it('`jsonp` option', () => {
            context.create('order', {
                pay: {
                    url: 'path'
                },
                transfer: {
                    jsonp: false,
                    url: 'path'
                },
                create: {
                    url: 'path.jsonp'
                },
                close: {
                    url: 'path.jsonp?foo'
                },
                delay: {
                    mock: true,
                    mockUrl: 'foo',
                    jsonp: false, // mock为true时, jsonp的值不会根据url的值自动纠正
                    url: 'path.jsonp?foo'
                }
            });

            expect(context.api.order.pay.config.jsonp).to.be(true);
            expect(context.api.order.transfer.config.jsonp).to.be(false);
            expect(context.api.order.create.config.jsonp).to.be(true);
            expect(context.api.order.close.config.jsonp).to.be(true);
            expect(context.api.order.delay.config.jsonp).to.be(false);
        });

        it('auto `urlPrefix`', function () {
            context.create('order', {
                method1: {
                    url: 'path'
                },
                method2: {
                    url: '//foo.com/path'
                },
                method3: {
                    url: 'http://foo.com/path'
                },
                method4: {
                    url: 'https://foo.com/path'
                },
                method5: {
                    url: './path'
                },
                method6: {
                    url: '../path'
                },
                method7: {
                    url: '/path'
                }
            });

            expect(context.api.order.method1.config.url).to.equal(host + 'path');
            expect(context.api.order.method2.config.url).to.be('//foo.com/path');
            expect(context.api.order.method3.config.url).to.be('http://foo.com/path');
            expect(context.api.order.method4.config.url).to.be('https://foo.com/path');
            expect(context.api.order.method5.config.url).to.be('./path');
            expect(context.api.order.method6.config.url).to.be('../path');
            expect(context.api.order.method7.config.url).to.be('/path');
        });
    });

    describe.skip('request config', function () {
        this.timeout(1000*10);
        let context;

        beforeEach('reset', function () {
            context = nattyFetch.context();
        });
        // 当使用request参数时, 只有data, retry, ignoreSelfConcurrent起作用
        it('`request` config with success', function (done) {
            let getPayId = (successFn) => {
                setTimeout(function () {
                    successFn({id: 1});
                }, 200);
            };
            context.create('order', {
                getSign: {
                    data: {
                        a: 1
                    },
                    request: function (vars, config, defer) {
                        // 验证参数是否正确合并
                        expect(vars.data.a).to.be(1);
                        expect(vars.data.b).to.be(1);
                        getPayId(function (content) {
                            defer.resolve(content);
                        });
                    }
                }
            });

            context.api.order.getSign({
                b: 1
            }).then(function (content) {
                expect(content.id).to.be(1);
                done();
            });
        });

        it('`request` config with error', function (done) {
            let getPayId = (successFn, errorFn) => {
                setTimeout(function () {
                    errorFn({message: 1});
                }, 200);
            };
            context.create('order', {
                getSign: {
                    request: function (data, config, defer, retryTime) {
                        getPayId(function (content) {
                            defer.resolve(content);
                        }, function (error) {
                            defer.reject(error);
                        });
                    }
                }
            });

            context.api.order.getSign().then(function (content) {
            }, function (error) {
                expect(error.message).to.be(1);
                done();
            });
        });

        it('`request` config with retry', function (done) {
            let getPayId = (successFn, errorFn) => {
                setTimeout(function () {
                    errorFn({message: 1});
                }, 200);
            };
            context.create('order', {
                getSign: {
                    retry: 1,
                    request: function (data, config, defer, retryTime) {
                        //console.log(retryTime);

                        getPayId(function (content) {
                            defer.resolve(content);
                        }, function (error) {
                            defer.reject(error);
                        });
                    }
                }
            });

            context.api.order.getSign().then(function (content) {
            }, function (error) {
                expect(error.message).to.be(1);
                done();
            });
        });

        it('`request` config with ignoreSelfConcurrent', function (done) {
            let count = 0;
            let getPayId = (successFn, errorFn) => {
                count++;
                setTimeout(function () {
                    errorFn({message:1});
                }, 200);
            };

            context.create('order', {
                getSign: {
                    ignoreSelfConcurrent: true,
                    request: function (data, config, defer, retryTime) {
                        //console.log(retryTime);

                        getPayId(function (content) {
                            defer.resolve(content);
                        }, function (error) {
                            defer.reject(error);
                        });
                    }
                }
            });

            context.api.order.getSign().then(function (content) {
            }, function (error) {
                expect(error.message).to.be(1);
            });

            context.api.order.getSign().then(function (content) {
            }, function (error) {
            });

            setTimeout(function () {
                expect(count).to.be(1);
                done();
            }, 1000);
        });
    });

    describe('ajax', function() {
        // NOTE 重要: 为了能够测试完整的场景, 默认已经全局关闭所有请求的浏览器缓存!!!  比如: ignoreSelfConcurrent
        //nattyFetch.setGlobal({
        //    cache: false,
        //    traditional: true
        //});

        this.timeout(1000*10);
        let context;

        beforeEach('reset', function () {
            context = nattyFetch.context({
                urlPrefix: host,
                mock: false
            });
        });

        it('play with standard data structure', function (done) {

            context.create('order', {
                create: {
                    url: 'api/order-create',
                    method: 'POST',
                    //traditional: true
                }
            });

            context.api.order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('play with non-standard data structure by `fit`', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/order-create-non-standard',
                    method: 'POST',
                    fit: function (response) {
                        return {
                            success: !response.hasError,
                            content: response.content
                        };
                    }
                }
            });
            context.api.order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('process data', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/order-create',
                    method: 'POST',
                    process: function (response) {
                        return {
                            orderId: response.id
                        };
                    }
                }
            });
            context.api.order.create().then(function(data) {
                try {
                    expect(data.orderId).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        // 固定参数和动态参数 在process和fix方法中都可以正确获取到
        it('`vars.data` in process or fix method', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/order-create',
                    method: 'POST',
                    data: {
                        fixData: 1
                    },
                    willFetch: function (vars, config) {
                        vars.data.hookData = 1;
                        // console.log(vars);
                        // console.log(config);
                        // console.log(this);
                    },
                    process: function (content, vars) {
                        expect(vars.data.fixData).to.be(1);
                        expect(vars.data.liveData).to.be(1);
                        expect(vars.data.hookData).to.be(1);
                        return {
                            orderId: content.id
                        };
                    },
                    fit: function (response, vars) {
                        expect(vars.data.fixData).to.be(1);
                        expect(vars.data.liveData).to.be(1);
                        expect(vars.data.hookData).to.be(1);
                        return response;
                    }
                }
            });

            context.api.order.create({
                liveData: 1
            }).then(function(data) {
                try {
                    expect(data.orderId).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });


        it('skip process data when it is mocking ', function (done) {
            context.create('order', {
                create: {
                    mock: true,
                    mockUrl: host + 'api/order-create',
                    process: function (response) {
                        if (this.mock) {
                            return response;
                        } else {
                            return {
                                orderId: response.id
                            };
                        }
                    }
                }
            });
            context.api.order.create().then(function(data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('error by requesting cross-domain with disabled header [NOTE: IE的行为已被标准化]', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/order-create',
                    method: 'POST',
                    header: {foo: 'foo'} // 跨域时, 自定义的`header`将被忽略
                }
            });

            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(e.message);
                }
            }, function(error) {
                // can not go here
            });
        });

        it('error by timeout', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/timeout',
                    method: 'POST',
                    timeout: 100
                }
            });
            context.api.order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.timeout).to.be(true);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('pending status checking', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/timeout',
                    method: 'POST',
                    timeout: 200
                }
            });
            context.api.order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(context.api.order.create.pending).to.be(false);
                    done();
                } catch(e) {
                    done(e);
                }
            });
            expect(context.api.order.create.pending).to.be(true);
        });

        it('error by 500', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/500',
                    method: 'POST'
                }
            });
            context.api.order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.status).to.be(nattyFetch.ajax.fallback ? undefined : 500);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('error by 404', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/404',
                    method: 'POST'
                }
            });

            // TODO
            context.on('reject', function (error) {
                console.warn(error);
            })
            context.api.order.create().then(function () {
                // can not go here
            })['catch'](function (error) {
                try {
                    if (!nattyFetch.ajax.fallback) {
                        // 即使是现代浏览器,也有status为0的情况
                        expect(error.status === 0 || error.status === 404).to.be(true);
                    } else {
                        expect(error.status).to.be(undefined);
                    }
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('`GET` resolving after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/retry-success',
                    method: 'GET',
                    retry: 2
                }
            });

            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            }, function() {
                // can not go here
            });
        });

        it('`GET` with fn-data resolving after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/retry-success',
                    method: 'GET',
                    retry: 2
                }
            });

            let count = 0;

            context.api.order.create(function () {
                return {
                    count: count++
                }
            }).then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            }, function() {
                // can not go here
            });
        });

        it('`POST` resolving after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/retry-success',
                    method: 'POST',
                    retry: 2
                }
            });

            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            }, function() {
                // can not go here
            });
        });

        it('rejecting after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/return-error',
                    retry: 1
                }
            });
            context.api.order.create().then(function (data) {
                // can not go here
            }, function(error) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        // 连发两次请求，第二次应该被忽略
        it('ignore seft concurrent', function (done) {

            context.create('order', {
                create: {
                    cache: false,
                    url: host + 'api/timeout', // 请求延迟返回的接口
                    ignoreSelfConcurrent: true
                }
            });

            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
            let dummyPromise = context.api.order.create().then(function(){
                throw new Error('unexpected `resolved`');
            });
            expect(dummyPromise).to.have.property('dummy');

            // 伪造的promise对象要保证支持链式调用
            expect(dummyPromise.then()).to.be(dummyPromise);
            expect(dummyPromise.then().catch()).to.be(dummyPromise);
        });

        // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有返回, 则取消掉第一次请求(即: 返回时不响应)
        it('override seft concurrent(XHR)', function (done) {

            context.create('order', {
                create: {
                    cache: false,
                    url: host + 'api/timeout', // 请求延迟返回的接口
                    overrideSelfConcurrent: true,
                    process: function(content, vars) {
                        // vars不应该混淆
                        expect(vars.data.d).to.be(2);
                    }
                }
            });

            let count = 0;

            // 第一次请求, 不应该有响应
            context.api.order.create({
                d: 1
            }).then(function (data) {
                count++
            });

            // 第二次请求, 只响应这次请求
            setTimeout(function(){
                context.api.order.create({
                    d:2
                }).then(function (data) {
                    try {
                        expect(count).to.be(0);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            }, 300);
        });

        // 连发两次请求, 第二次请求发起时, 如果第一次请求还没有响应, 则取消掉第一次请求(的响应)
        it('override seft concurrent(JSONP)', function (done) {

            context.create('order', {
                create: {
                    cache: false,
                    jsonp: true,
                    url: host + 'api/jsonp-timeout', // 请求延迟返回的接口
                    overrideSelfConcurrent: true,
                    process: function(content, vars) {
                        // vars不应该混淆
                        expect(vars.data.d).to.be(2);
                    }
                }
            });

            let count = 0;

            // 第一次请求, 不应该有响应
            context.api.order.create({
                d: 1
            }).then(function (data) {
                count++
            });

            // 第二次请求, 只响应这次请求
            setTimeout(function(){
                context.api.order.create({
                    d:2
                }).then(function (data) {
                    try {
                        expect(count).to.be(0);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
            }, 300);
        });
    });
    

    describe('jsonp', function () {
        // NOTE 重要: 为了能够测试完整的场景, 默认已经全局关闭所有请求的浏览器缓存!!!  比如: ignoreSelfConcurrent
        //nattyFetch.setGlobal({
        //    cache: false
        //});

        this.timeout(1000*10);
        let context;

        beforeEach('reset', function () {
            context = nattyFetch.context({
                urlPrefix: host,
                mock: false
            });
        });

        it('check default jsonpCallbackQuery', function () {
            context.create('order', {
                create: {
                    url: host + 'api/order-create',
                    jsonp: true
                }
            });

            expect(context.api.order.create.config.jsonpCallbackQuery).to.be(undefined);
        });

        it('check custom jsonpCallbackQuery', function () {
            context.create('order', {
                create: {
                    url: host + 'api/order-create',
                    jsonp: [true, 'cb', 'j{id}']
                }
            });

            expect(context.api.order.create.config.jsonp).to.be(true);
            expect(context.api.order.create.config.jsonpFlag).to.be('cb');
            expect(context.api.order.create.config.jsonpCallbackName).to.be('j{id}');
        });

        it('auto detect jsonp option', function () {
            context.create('order', {
                create: {
                    url: host + 'api/order-create.jsonp'
                }
            });

            expect(context.api.order.create.config.jsonp).to.be(true);
        });

        it('jsonp response.success is true', function (done) {
            context.create('order', {
                create: {
                    traditional: true,
                    data: {
                        a: [1,2,3]
                    },
                    //log: true,
                    url: host + 'api/jsonp-order-create',
                    jsonp: true
                }
            });

            context.api.order.create().then(function (data) {

                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('jsonp response.success is false ', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/jsonp-order-create-error',
                    jsonp: true
                }
            });

            context.api.order.create().then(function (data) {
                // can not go here
            }, function (error) {
                try {
                    expect(error).to.have.property('message');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        // jsonp无法使用状态吗识别出具体的404、500等错误，都统一成`无法连接`的错误信息
        it('jsonp with error url', function (done) {
            context.create('order', {
                create: {
                    url: host + 'error-url',
                    jsonp: true
                }
            });

            // TODO
            context.on('reject', function (error) {
                console.warn(error);
            });

            context.api.order.create().then(function (data) {
                // can not go here
            }, function (error) {
                try {
                    expect(error.message).to.contain('Not Accessable JSONP');
                    done();
                } catch (e) {
                    done(e);
                }
            });
        });

        it('jsonp timeout', function (done) {
            context.create('order', {
                create: {
                    //log: true,
                    url: host + 'api/jsonp-timeout',
                    jsonp: true,
                    timeout: 300
                }
            });
            context.api.order.create().then(function () {
                // can not go here
            }, function(error) {
                try {
                    expect(error.timeout).to.be(true);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('`JSONP` resolving after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/jsonp-retry-success',
                    jsonp: true,
                    retry: 2
                }
            });

            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            }, function() {
                // can not go here
            });
        });

        it('rejecting after retry', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/jsonp-error',
                    jsonp: true,
                    retry: 1
                }
            });
            context.api.order.create().then(function (data) {
                // can not go here
            }, function(error) {
                try {
                    expect(error.code).to.be(1);
                    done();
                } catch(e) {
                    done(e);
                }
            });
        });

        it('ignore self concurrent', function (done) {
            context.create('order', {
                create: {
                    url: host + 'api/jsonp-timeout', // 请求延迟返回的接口
                    jsonp: true,
                    ignoreSelfConcurrent: true
                }
            });

            // 连发两次请求，第二次应该被忽略
            context.api.order.create().then(function (data) {
                try {
                    expect(data.id).to.be(1);
                    done();
                } catch (e) {
                    done(e);
                }
            });

            // 第一次请求未完成之前 第二次请求返回的是一个伪造的promise对象
            let dummyPromise = context.api.order.create();
            expect(dummyPromise).to.have.property('dummy');

            // 伪造的promise对象要保证支持链式调用
            expect(dummyPromise.then()).to.be(dummyPromise);
            expect(dummyPromise.then().catch()).to.be(dummyPromise);
        });
    });

});
