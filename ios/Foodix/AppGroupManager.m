//
//  AppGroupManager.m
//  Foodix
//
//  Created by (RE)SET on 23/09/2025.
//

#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(AppGroupManager, NSObject)

RCT_EXTERN_METHOD(getSharedURLs:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(markURLAsProcessed:(NSString *)key callback:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(clearProcessedURLs:(RCTResponseSenderBlock)callback)
RCT_EXTERN_METHOD(testAppGroup:(RCTResponseSenderBlock)callback)

@end