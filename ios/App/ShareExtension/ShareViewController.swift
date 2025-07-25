//
//  ShareViewController.swift
//  ShareExtension
//
//  Created by Kai Moriguchi on 2025/07/25.
//

import UIKit
import Social
import MobileCoreServices

class ShareViewController: SLComposeServiceViewController {
    
    override func isContentValid() -> Bool {
        // Validate that we have a URL to share
        return hasContent()
    }
    
    private func hasContent() -> Bool {
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            return false
        }
        
        for item in extensionItems {
            if let attachments = item.attachments {
                for attachment in attachments {
                    if attachment.hasItemConformingToTypeIdentifier(kUTTypeURL as String) ||
                       attachment.hasItemConformingToTypeIdentifier(kUTTypeText as String) {
                        return true
                    }
                }
            }
        }
        return false
    }
    
    override func didSelectPost() {
        // Extract the shared content
        guard let extensionItems = extensionContext?.inputItems as? [NSExtensionItem] else {
            self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
            return
        }
        
        for item in extensionItems {
            if let attachments = item.attachments {
                for attachment in attachments {
                    // Handle URL
                    if attachment.hasItemConformingToTypeIdentifier(kUTTypeURL as String) {
                        attachment.loadItem(forTypeIdentifier: kUTTypeURL as String, options: nil) { [weak self] (url, error) in
                            if let shareURL = url as? URL {
                                self?.openCreativeOS(with: shareURL.absoluteString, comment: self?.textView.text)
                            }
                        }
                    }
                    // Handle Text
                    else if attachment.hasItemConformingToTypeIdentifier(kUTTypeText as String) {
                        attachment.loadItem(forTypeIdentifier: kUTTypeText as String, options: nil) { [weak self] (text, error) in
                            if let shareText = text as? String {
                                // Check if text contains a URL
                                if let url = self?.extractURL(from: shareText) {
                                    self?.openCreativeOS(with: url, comment: self?.textView.text)
                                } else {
                                    self?.openCreativeOS(with: shareText, comment: self?.textView.text)
                                }
                            }
                        }
                    }
                }
            }
        }
        
        self.extensionContext?.completeRequest(returningItems: [], completionHandler: nil)
    }
    
    private func extractURL(from text: String) -> String? {
        let detector = try? NSDataDetector(types: NSTextCheckingResult.CheckingType.link.rawValue)
        let matches = detector?.matches(in: text, options: [], range: NSRange(location: 0, length: text.utf16.count))
        return matches?.first?.url?.absoluteString
    }
    
    private func openCreativeOS(with url: String, comment: String?) {
        // Create URL scheme to open main app
        var components = URLComponents()
        components.scheme = "creativeos"
        components.host = "share"
        
        var queryItems = [URLQueryItem(name: "url", value: url)]
        if let comment = comment, !comment.isEmpty {
            queryItems.append(URLQueryItem(name: "comment", value: comment))
        }
        components.queryItems = queryItems
        
        // Save to shared container for the main app to read
        if let sharedDefaults = UserDefaults(suiteName: "group.com.creativeos.app") {
            sharedDefaults.set(url, forKey: "sharedURL")
            sharedDefaults.set(comment, forKey: "sharedComment")
            sharedDefaults.set(Date(), forKey: "sharedDate")
            sharedDefaults.synchronize()
        }
        
        // Open the main app if possible
        if let appURL = components.url {
            _ = openURL(appURL)
        }
    }
    
    @objc private func openURL(_ url: URL) -> Bool {
        var responder: UIResponder? = self
        while responder != nil {
            if let application = responder as? UIApplication {
                return application.perform(#selector(openURL(_:)), with: url) != nil
            }
            responder = responder?.next
        }
        return false
    }
    
    override func configurationItems() -> [Any]! {
        // No additional configuration items
        return []
    }
}
