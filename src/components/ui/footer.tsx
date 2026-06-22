import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border mt-8">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <Link href="/">
              <img src="/logo.svg" alt="Aeternum" className="h-7 md:h-9 w-auto mb-3" />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              AI-powered personal styling from Aeternum India.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Features</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/ai-shopping" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    AI Shopping
                  </Link>
                </li>
                <li>
                  <Link href="/virtual-try-on" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Virtual Try-On
                  </Link>
                </li>
                <li>
                  <Link href="/color-analysis" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Color Analysis
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://aeternumindia.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Visit Shop
                  </a>
                </li>
                <li>
                  <a
                    href="https://aeternumindia.com/pages/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="text-sm font-semibold text-foreground mb-3">Support</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://aeternumindia.com/pages/shipping-returns"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Shipping &amp; Returns
                  </a>
                </li>
                <li>
                  <a
                    href="https://aeternumindia.com/pages/size-guide"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Size Guide
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Aeternum India. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
